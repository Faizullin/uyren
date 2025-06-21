import { NextRequest, NextResponse } from 'next/server';

// Types for the Ideone API
interface IdeoneApiParams {
  user?: string;
  pass?: string;
  sourceCode?: string;
  language?: number;
  input?: string;
  wait?: boolean;
  private?: boolean;
  link?: string;
  withSource?: boolean;
  withInput?: boolean;
  withOutput?: boolean;
  withStderr?: boolean;
  withCmpinfo?: boolean;
}

// Extended types for competitive programming
interface TestCase {
  input: string;
  expectedOutput: string;
}

interface JudgeRequest {
  code: string;
  language: number;
  testCases: TestCase[];
  problemId?: string;
  userId?: string;
}

interface JudgeResult {
  status: 'Accepted' | 'Wrong Answer' | 'Compilation Error' | 'Runtime Error' | 'Time Limit Exceeded' | 'Memory Limit Exceeded';
  details?: string;
  passedTests: number;
  totalTests: number;
  executionTime?: number;
  color: string;
}

interface IdeoneRequestBody {
  endpoint: string;
  params: IdeoneApiParams;
  judgeRequest?: JudgeRequest; // New field for competitive programming
}

// Ideone API base URL
const IDEONE_API_BASE = 'https://ideone.com/api/1/service.json';

// Hardcoded credentials (should be moved to environment variables)
const IDEONE_USER = process.env.IDEONE_USER || '';
const IDEONE_PASSWORD = process.env.IDEONE_PASSWORD || '';

/**
 * Proxy endpoint for Ideone API requests
 * Enhanced to support competitive programming judge functionality
 */
export async function POST(request: NextRequest) {
  try {
    const body: IdeoneRequestBody = await request.json();
    const { endpoint, params, judgeRequest } = body;

    // Handle competitive programming judge requests
    if (judgeRequest) {
      const result = await judgeSubmission(judgeRequest);
      return NextResponse.json(result);
    }

    // Validate required parameters for regular API calls
    if (!endpoint || !params) {
      return NextResponse.json(
        { error: 'Missing endpoint or parameters' },
        { status: 400 }
      );
    }

    // Map of valid Ideone endpoints
    const validEndpoints = [
      'createSubmission',
      'getSubmissionStatus',
      'getSubmissionDetails',
      'getLanguages',
      'testFunction'
    ];

    if (!validEndpoints.includes(endpoint)) {
      return NextResponse.json(
        { error: 'Invalid endpoint' },
        { status: 400 }
      );
    }

    // Add credentials to params if not present
    const requestParams = {
      user: IDEONE_USER,
      pass: IDEONE_PASSWORD,
      ...params
    };

    // Prepare the request to Ideone API
    const ideoneUrl = `${IDEONE_API_BASE}/${endpoint}`;
    
    // Create form data for the POST request
    const formData = new FormData();
    Object.entries(requestParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    // Make request to Ideone API
    const response = await fetch(ideoneUrl, {
      method: 'POST',
      body: formData,
      // Add timeout
      signal: AbortSignal.timeout(30000) // 30 seconds
    });

    if (!response.ok) {
      throw new Error(`Ideone API responded with status: ${response.status}`);
    }

    const responseData = await response.json();

    // Log the request for debugging (remove in production)
    console.log(`Ideone ${endpoint} request:`, {
      endpoint,
      status: response.status,
      hasError: responseData.error !== 'OK'
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Code execution API error:', error);

    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout' },
          { status: 408 }
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

/**
 * Judge code against multiple test cases (similar to Python probstate function)
 */
async function judgeSubmission(judgeRequest: JudgeRequest): Promise<JudgeResult> {
  const { code, language, testCases } = judgeRequest;
  let overallResult: JudgeResult = {
    status: 'Accepted',
    passedTests: 0,
    totalTests: testCases.length,
    color: 'green'
  };

  // Iterate through all test cases (like the Python for loop)
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    
    try {
      // 1. Create submission (equivalent to sud_client.service.createSubmission)
      const submissionResponse = await createIdeoneSubmission(code, language, testCase.input);
      const submissionLink = extractSubmissionLink(submissionResponse);

      // 2. Wait for completion (equivalent to Python while loop)
      await waitForSubmissionCompletion(submissionLink);

      // 3. Get results (equivalent to sud_client.service.getSubmissionDetails)
      const details = await getSubmissionDetails(submissionLink);
      const result = parseSubmissionResult(details);

      // 4. Check result status (equivalent to Python if/elif chain)
      if (result.resultCode === 11) {
        return {
          status: 'Compilation Error',
          details: result.compilationInfo,
          passedTests: i,
          totalTests: testCases.length,
          color: 'yellow'
        };
      } else if (result.resultCode === 12) {
        return {
          status: 'Runtime Error',
          details: 'Runtime error occurred',
          passedTests: i,
          totalTests: testCases.length,
          color: 'red'
        };
      } else if (result.resultCode === 13) {
        return {
          status: 'Time Limit Exceeded',
          details: 'Time limit exceeded',
          passedTests: i,
          totalTests: testCases.length,
          color: 'yellow'
        };
      } else if (result.resultCode === 17) {
        return {
          status: 'Memory Limit Exceeded',
          details: 'Memory limit exceeded',
          passedTests: i,
          totalTests: testCases.length,
          color: 'red'
        };
      } else if (result.resultCode === 15) {
        // Check if output matches expected (equivalent to Python output comparison)
        const actualOutput = result.output?.trim() || '';
        const expectedOutput = testCase.expectedOutput.trim();
        
        if (actualOutput !== expectedOutput) {
          return {
            status: 'Wrong Answer',
            details: `Test case ${i + 1}: Expected "${expectedOutput}", got "${actualOutput}"`,
            passedTests: i,
            totalTests: testCases.length,
            color: 'red'
          };
        }
        overallResult.passedTests++;
      }
    } catch (error) {
      return {
        status: 'Runtime Error',
        details: error instanceof Error ? error.message : 'Unknown error',
        passedTests: i,
        totalTests: testCases.length,
        color: 'red'
      };
    }
  }

  return overallResult;
}

/**
 * Helper functions for Ideone API interaction
 */
async function createIdeoneSubmission(code: string, language: number, input: string) {
  const formData = new FormData();
  formData.append('user', IDEONE_USER);
  formData.append('pass', IDEONE_PASSWORD);
  formData.append('sourceCode', code);
  formData.append('language', language.toString());
  formData.append('input', input);
  formData.append('wait', 'false');
  formData.append('private', 'true');

  const response = await fetch(`${IDEONE_API_BASE}/createSubmission`, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(30000)
  });

  return await response.json();
}

function extractSubmissionLink(response: any): string {
  // Extract link similar to Python: link=sub['item'][1]['value'][0]
  return response.item?.[1]?.value?.[0] || '';
}

async function waitForSubmissionCompletion(link: string): Promise<void> {
  // Equivalent to Python while loop checking status
  let status = 1;
  while (status !== 0) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // sleep(2)
    
    const formData = new FormData();
    formData.append('user', IDEONE_USER);
    formData.append('pass', IDEONE_PASSWORD);
    formData.append('link', link);

    const response = await fetch(`${IDEONE_API_BASE}/getSubmissionStatus`, {
      method: 'POST',
      body: formData
    });

    const statusData = await response.json();
    status = statusData.item?.[1]?.value?.[0] || 1;
  }
}

async function getSubmissionDetails(link: string) {
  const formData = new FormData();
  formData.append('user', IDEONE_USER);
  formData.append('pass', IDEONE_PASSWORD);
  formData.append('link', link);
  formData.append('withSource', 'false');
  formData.append('withInput', 'false');
  formData.append('withOutput', 'true');
  formData.append('withStderr', 'true');
  formData.append('withCmpinfo', 'true');

  const response = await fetch(`${IDEONE_API_BASE}/getSubmissionDetails`, {
    method: 'POST',
    body: formData
  });

  return await response.json();
}

function parseSubmissionResult(details: any) {
  // Equivalent to Python: gen=dict() and for loop parsing
  const result: any = {};
  
  if (details.item) {
    for (const item of details.item) {
      result[item.key] = item.value?.[0];
    }
  }

  return {
    resultCode: result.result,
    output: result.output,
    compilationInfo: result.cmpinfo,
    time: result.time,
    memory: result.memory
  };
}
