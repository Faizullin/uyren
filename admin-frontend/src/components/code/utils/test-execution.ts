/**
 * Test script for code execution functionality
 * Run this to verify the API integration is working
 */

import { codeExecutionService } from '../services/code-execution.service';
import { ExecutionRequest } from '../types/code-runner.types';

export async function testCodeExecution() {
  const testCases: ExecutionRequest[] = [
    {
      code: 'console.log("Hello, World!");',
      language: 'javascript'
    },
    {
      code: 'print("Hello from Python!")',
      language: 'python'
    },
    {
      code: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello from C++!" << endl;
    return 0;
}`,
      language: 'cpp'
    }
  ];

  console.log('Testing code execution service...');

  for (const testCase of testCases) {
    try {
      console.log(`\nTesting ${testCase.language}...`);
      const result = await codeExecutionService.executeCode(testCase);
      
      console.log('✅ Result:', {
        status: result.status,
        output: result.output?.substring(0, 100) + (result.output && result.output.length > 100 ? '...' : ''),
        executionTime: result.executionTime,
        error: result.error
      });
    } catch (error) {
      console.error(`❌ Error testing ${testCase.language}:`, error);
    }
  }
}

// Example usage for testing input/output
export async function testWithInput() {
  const testCase: ExecutionRequest = {
    code: `name = input("Enter your name: ")
print(f"Hello, {name}!")`,
    language: 'python',
    input: 'World'
  };

  try {
    console.log('\nTesting with input...');
    const result = await codeExecutionService.executeCode(testCase);
    console.log('✅ Result with input:', result);
  } catch (error) {
    console.error('❌ Error testing with input:', error);
  }
}
