"use client";

import React from 'react';
import { CompetitiveProgrammingJudge } from '@/components/code';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Sample test cases for different problem types
const SAMPLE_PROBLEMS = {
  fibonacci: {
    title: "Fibonacci Numbers",
    description: "Write a program that takes an integer n as input and prints the nth Fibonacci number.",
    language: "python",
    starterCode: `n = int(input())
# Write your code here to calculate nth fibonacci number
print(result)`,
    testCases: [
      { input: "0", expectedOutput: "0", description: "Base case: F(0) = 0" },
      { input: "1", expectedOutput: "1", description: "Base case: F(1) = 1" },
      { input: "5", expectedOutput: "5", description: "F(5) = 5" },
      { input: "10", expectedOutput: "55", description: "F(10) = 55" },
      { input: "15", expectedOutput: "610", description: "F(15) = 610" }
    ]
  },
  
  sum: {
    title: "Array Sum",
    description: "Given an array of integers, calculate and print their sum.",
    language: "python", 
    starterCode: `n = int(input())
arr = list(map(int, input().split()))
# Calculate sum and print it
print(sum(arr))`,
    testCases: [
      { 
        input: "3\\n1 2 3", 
        expectedOutput: "6", 
        description: "Sum of [1, 2, 3] = 6" 
      },
      { 
        input: "5\\n10 20 30 40 50", 
        expectedOutput: "150", 
        description: "Sum of [10, 20, 30, 40, 50] = 150" 
      },
      { 
        input: "1\\n42", 
        expectedOutput: "42", 
        description: "Single element array" 
      },
      { 
        input: "4\\n-1 -2 -3 -4", 
        expectedOutput: "-10", 
        description: "Negative numbers" 
      }
    ]
  },

  palindrome: {
    title: "Palindrome Check",
    description: "Check if a given string is a palindrome. Print 'YES' if it is, 'NO' otherwise.",
    language: "python",
    starterCode: `s = input().strip()
# Check if string is palindrome
# Print 'YES' or 'NO'`,
    testCases: [
      { input: "racecar", expectedOutput: "YES", description: "Classic palindrome" },
      { input: "hello", expectedOutput: "NO", description: "Not a palindrome" },
      { input: "a", expectedOutput: "YES", description: "Single character" },
      { input: "abba", expectedOutput: "YES", description: "Even length palindrome" },
      { input: "Aa", expectedOutput: "NO", description: "Case sensitive" }
    ]
  },

  factorial: {
    title: "Factorial Calculator",
    description: "Calculate the factorial of a given number n.",
    language: "cpp",
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    
    // Calculate factorial
    long long factorial = 1;
    for(int i = 1; i <= n; i++) {
        factorial *= i;
    }
    
    cout << factorial << endl;
    return 0;
}`,
    testCases: [
      { input: "0", expectedOutput: "1", description: "0! = 1" },
      { input: "1", expectedOutput: "1", description: "1! = 1" },
      { input: "5", expectedOutput: "120", description: "5! = 120" },
      { input: "10", expectedOutput: "3628800", description: "10! = 3628800" }
    ]
  }
};

export default function CompetitiveProgrammingDemo() {
  const handleSubmissionComplete = (result: any) => {
    console.log('Submission completed:', result);
    
    if (result.status === 'Accepted') {
      // In a real application, you might show a success notification
      // or redirect to a submissions page
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Competitive Programming Judge</h1>
        <p className="text-muted-foreground">
          Test your solutions against multiple test cases, just like in competitive programming contests
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Practice Problems</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="fibonacci" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="fibonacci">Fibonacci</TabsTrigger>
              <TabsTrigger value="sum">Array Sum</TabsTrigger>
              <TabsTrigger value="palindrome">Palindrome</TabsTrigger>
              <TabsTrigger value="factorial">Factorial</TabsTrigger>
            </TabsList>
            
            {Object.entries(SAMPLE_PROBLEMS).map(([key, problem]) => (
              <TabsContent key={key} value={key} className="mt-4 space-y-4">
                {/* Problem Description */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{problem.title}</CardTitle>
                      <Badge variant="outline">{problem.language.toUpperCase()}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{problem.description}</p>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold">Test Cases:</h4>
                      <div className="grid gap-2">
                        {problem.testCases.map((testCase, index) => (
                          <div key={index} className="text-sm bg-muted p-3 rounded">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              <div>
                                <span className="font-medium">Input:</span>
                                <pre className="text-xs mt-1">{testCase.input.replace('\\n', '\\n')}</pre>
                              </div>
                              <div>
                                <span className="font-medium">Output:</span>
                                <pre className="text-xs mt-1">{testCase.expectedOutput}</pre>
                              </div>
                              <div>
                                <span className="font-medium">Description:</span>
                                <p className="text-xs mt-1">{testCase.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Judge Component */}
                <CompetitiveProgrammingJudge
                  initialCode={problem.starterCode}
                  language={problem.language}
                  testCases={problem.testCases}
                  problemId={key}
                  userId="demo-user"
                  onSubmissionComplete={handleSubmissionComplete}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">📝 Submission Process</h3>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Write your solution in the code editor</li>
                <li>Click Submit Solution to start judging</li>
                <li>Your code runs against all test cases</li>
                <li>Get instant feedback on each test case</li>
                <li>View detailed results and debug information</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">🏆 Judge Results</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">Accepted</Badge>
                  <span className="text-muted-foreground">All test cases passed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-800">Wrong Answer</Badge>
                  <span className="text-muted-foreground">Output doesnt match expected</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-100 text-yellow-800">Time Limit Exceeded</Badge>
                  <span className="text-muted-foreground">Code took too long to execute</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-800">Runtime Error</Badge>
                  <span className="text-muted-foreground">Code crashed during execution</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-100 text-yellow-800">Compilation Error</Badge>
                  <span className="text-muted-foreground">Code has syntax errors</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">⚙️ Features</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Multi-language support (Python, C++, Java, JavaScript, etc.)</li>
              <li>• Real-time test case execution with detailed feedback</li>
              <li>• Automatic solution tracking for accepted submissions</li>
              <li>• Performance metrics (execution time, memory usage)</li>
              <li>• Detailed error reporting and debugging information</li>
              <li>• User statistics and progress tracking</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
