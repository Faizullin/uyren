import { 
  ExecutionRequest, 
  ExecutionResult, 
  ExecutionStatus,
  IDEONE_LANGUAGE_MAP
} from '../types/code-runner.types';

// New types for competitive programming
export interface TestCase {
  input: string;
  expectedOutput: string;
  description?: string;
}

export interface JudgeRequest {
  code: string;
  language: string;
  testCases: TestCase[];
  problemId?: string;
  userId?: string;
}

export type JudgeStatus = 
  | 'Accepted'
  | 'Wrong Answer'
  | 'Compilation Error'
  | 'Runtime Error'
  | 'Time Limit Exceeded'
  | 'Memory Limit Exceeded'
  | 'Partial'
  | 'Judging';

export interface JudgeResult {
  status: JudgeStatus;
  details?: string;
  passedTests: number;
  totalTests: number;
  executionTime?: number;
  color: string;
  testResults?: Array<{
    passed: boolean;
    input: string;
    expectedOutput: string;
    actualOutput?: string;
    error?: string;
  }>;
}

class CompetitiveProgrammingService {
  /**
   * Judge code against multiple test cases (competitive programming style)
   * Based on the Python probstate function logic
   */
  async judgeCode(request: JudgeRequest): Promise<JudgeResult> {
    const languageId = IDEONE_LANGUAGE_MAP[request.language];
    if (!languageId) {
      throw new Error(`Unsupported language: ${request.language}`);
    }

    try {
      const response = await fetch('/api/code-execution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          judgeRequest: {
            code: request.code,
            language: languageId,
            testCases: request.testCases,
            problemId: request.problemId,
            userId: request.userId
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Judge submission failed:', error);
      throw error;
    }
  }

  /**
   * Get available languages from Ideone API
   * Equivalent to the Python sud_client.service.getLanguages() call
   */
  async getAvailableLanguages(): Promise<Array<{key: string, value: string}>> {
    try {
      const response = await fetch('/api/code-execution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: 'getLanguages',
          params: {}
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Parse the response similar to Python code
      const languages: Array<{key: string, value: string}> = [];
      
      if (data.item && data.item[1] && data.item[1].value && data.item[1].value[1]) {
        const langList = data.item[1].value[1][1];
        
        if (langList && langList[0] && langList[0][0]) {
          for (const lang of langList[0][0]) {
            languages.push({
              key: lang[0][0],
              value: lang[1][0]
            });
          }
        }
      }

      return languages;

    } catch (error) {
      console.error('Failed to get languages:', error);
      throw error;
    }
  }

  /**
   * Submit and track accepted solutions
   * Equivalent to the Python code that saves to 'accepted' table
   */
  async submitAcceptedSolution(data: {
    problemId: string;
    userId: string;
    code: string;
    language: string;
  }): Promise<boolean> {
    try {
      // This would typically call your backend API to save the accepted solution
      const response = await fetch('/api/submissions/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to save accepted solution:', error);
      return false;
    }
  }

  /**
   * Update team/user statistics
   * Equivalent to the Python code that updates teamr.objects
   */
  async updateUserStats(userId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/users/update-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to update user stats:', error);
      return false;
    }
  }
}

export const competitiveProgrammingService = new CompetitiveProgrammingService();
