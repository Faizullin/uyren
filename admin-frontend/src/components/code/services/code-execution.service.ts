import {
  ExecutionRequest,
  ExecutionResult,
  ExecutionStatus,
  IDEONE_LANGUAGE_MAP,
  IdeoneSubmission,
  getExecutionStatusFromIdeone
} from '../types/code-runner.types';

// Ideone API configuration
const IDEONE_CONFIG = {
  baseUrl: 'https://ideone.com/api/1',
  user: process.env.NEXT_PUBLIC_IDEONE_USER || '',
  password: process.env.NEXT_PUBLIC_IDEONE_PASSWORD || '',
  // Note: For production, these should be stored securely on the backend
};


class CodeExecutionService {
  private async makeIdeoneRequest(endpoint: string, params: Record<string, any>): Promise<any> {
    try {
      // Since we're in the browser, we'll need to proxy through our backend
      // For now, we'll simulate the API response
      const response = await fetch('/api/code-execution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint,
          params: {
            user: IDEONE_CONFIG.user,
            pass: IDEONE_CONFIG.password,
            ...params
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Ideone API request failed:', error);
      throw error;
    }
  }

  private async createSubmission(code: string, languageId: number, input: string = ''): Promise<string> {
    const response = await this.makeIdeoneRequest('createSubmission', {
      sourceCode: code,
      language: languageId,
      input: input,
      wait: false,
      private: true
    });

    if (response.error !== 'OK') {
      throw new Error(`Submission failed: ${response.error}`);
    }

    // Extract submission link from response
    const linkItem = response.item?.find((item: any) => item.key === 'link');
    if (!linkItem) {
      throw new Error('No submission link received');
    }

    return linkItem.value[0];
  }

  private async getSubmissionStatus(link: string): Promise<{ status: number; result?: number }> {
    const response = await this.makeIdeoneRequest('getSubmissionStatus', { link });

    if (response.error !== 'OK') {
      throw new Error(`Status check failed: ${response.error}`);
    }

    const statusItem = response.item?.find((item: any) => item.key === 'status');
    const resultItem = response.item?.find((item: any) => item.key === 'result');

    return {
      status: statusItem?.value[0] || -1,
      result: resultItem?.value[0]
    };
  }

  private async getSubmissionDetails(link: string): Promise<IdeoneSubmission> {
    const response = await this.makeIdeoneRequest('getSubmissionDetails', {
      link,
      withSource: false,
      withInput: false,
      withOutput: true,
      withStderr: true,
      withCmpinfo: true
    });

    if (response.error !== 'OK') {
      throw new Error(`Details fetch failed: ${response.error}`);
    }

    // Parse the response items into a more usable format
    const details: any = {};
    response.item?.forEach((item: any) => {
      details[item.key] = item.value[0];
    });

    return {
      link,
      status: details.status || 0,
      result: details.result,
      output: details.output,
      cmpinfo: details.cmpinfo,
      time: details.time,
      memory: details.memory
    };
  }

  private async waitForCompletion(link: string, maxWaitTime: number = 30000): Promise<IdeoneSubmission> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.getSubmissionStatus(link);

      if (status.status === 0) {
        // Execution completed
        return await this.getSubmissionDetails(link);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Execution timeout');
  }

  async executeCode(request: ExecutionRequest): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      const languageId = IDEONE_LANGUAGE_MAP[request.language];
      if (!languageId) {
        throw new Error(`Unsupported language: ${request.language}`);
      }

      // Create submission
      const submissionLink = await this.createSubmission(
        request.code,
        languageId,
        request.input || ''
      );

      // Wait for completion
      const submission = await this.waitForCompletion(submissionLink);
      const executionTime = Date.now() - startTime;

      // Parse the result
      const status = getExecutionStatusFromIdeone(submission.result || 0);

      let output = submission.output || '';
      let error = '';
      const compilationInfo = submission.cmpinfo || '';

      // Handle different result types
      if (submission.result === 11) {
        // Compilation error
        error = compilationInfo || 'Compilation failed';
        output = '';
      } else if (submission.result === 12) {
        // Runtime error
        error = output || 'Runtime error occurred';
        output = '';
      } else if (submission.result === 13) {
        // Time limit exceeded
        error = 'Time limit exceeded';
      } else if (submission.result === 17) {
        // Memory limit exceeded
        error = 'Memory limit exceeded';
      }

      return {
        status,
        output: output.trim(),
        error: error.trim() || undefined,
        compilationInfo: compilationInfo.trim() || undefined,
        executionTime,
        memoryUsed: submission.memory ? `${submission.memory} KB` : undefined,
        timestamp: Date.now(),
        language: request.language
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        status: 'error' as ExecutionStatus,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        executionTime,
        timestamp: Date.now(),
        language: request.language
      };
    }
  }

  // Fallback execution for when Ideone is not available
  async executeCodeFallback(request: ExecutionRequest): Promise<ExecutionResult> {
    // This would use a different service or local execution
    // For demo purposes, we'll return a mock result
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate execution time

    return {
      status: 'success' as ExecutionStatus,
      output: `// Mock execution result for ${request.language}\n// Code executed successfully\nconsole.log("Hello, World!");`,
      executionTime: 1000,
      timestamp: Date.now(),
      language: request.language
    };
  }
}

export const codeExecutionService = new CodeExecutionService();
