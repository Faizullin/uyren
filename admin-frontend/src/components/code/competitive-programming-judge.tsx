"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import {
  competitiveProgrammingService,
  JudgeRequest,
  JudgeResult,
  TestCase
} from './services/competitive-programming.service';

interface CompetitiveProgrammingJudgeProps {
  initialCode?: string;
  language: string;
  testCases: TestCase[];
  problemId?: string;
  userId?: string;
  onSubmissionComplete?: (result: JudgeResult) => void;
  className?: string;
}

export const CompetitiveProgrammingJudge: React.FC<CompetitiveProgrammingJudgeProps> = ({
  initialCode = '',
  language,
  testCases,
  problemId,
  userId,
  onSubmissionComplete,
  className = ''
}) => {
  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [isJudging, setIsJudging] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!code.trim() || testCases.length === 0) return;

    setIsJudging(true);
    setResult(null);

    try {
      const judgeRequest: JudgeRequest = {
        code,
        language,
        testCases,
        problemId,
        userId
      };

      const judgeResult = await competitiveProgrammingService.judgeCode(judgeRequest);
      setResult(judgeResult);

      // Handle accepted solutions (equivalent to Python accepted table logic)
      if (judgeResult.status === 'Accepted' && problemId && userId) {
        await competitiveProgrammingService.submitAcceptedSolution({
          problemId,
          userId,
          code,
          language
        });

        await competitiveProgrammingService.updateUserStats(userId);
      }

      onSubmissionComplete?.(judgeResult);

    } catch (error) {
      const errorResult: JudgeResult = {
        status: 'Runtime Error',
        details: error instanceof Error ? error.message : 'Unknown error',
        passedTests: 0,
        totalTests: testCases.length,
        color: 'red'
      };

      setResult(errorResult);
    } finally {
      setIsJudging(false);
    }
  }, [code, language, testCases, problemId, userId, onSubmissionComplete]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Accepted':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Wrong Answer':
      case 'Runtime Error':
      case 'Memory Limit Exceeded':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'Compilation Error':
      case 'Time Limit Exceeded':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Wrong Answer':
      case 'Runtime Error':
      case 'Memory Limit Exceeded':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Compilation Error':
      case 'Time Limit Exceeded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Code Editor */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Submit Solution</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{language}</Badge>
            <Badge variant="outline">{testCases.length} test cases</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`Enter your ${language} solution here...`}
            className="min-h-[300px] font-mono text-sm"
            disabled={isJudging}
          />

          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={isJudging || !code.trim()}
              className="flex items-center gap-2"
            >
              {isJudging ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Judging...
                </>
              ) : (
                'Submit Solution'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {(result || isJudging) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result && getStatusIcon(result.status)}
              Judge Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isJudging ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Running your code against test cases...
                </p>
              </div>
            ) : result ? (
              <div className="space-y-4">
                {/* Overall Status */}
                <div className={`p-4 rounded-lg border-2 ${getStatusColor(result.status)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <span className="font-semibold text-lg">{result.status}</span>
                    </div>
                    <div className="text-sm">
                      {result.passedTests}/{result.totalTests} tests passed
                    </div>
                  </div>
                  {result.details && (
                    <p className="mt-2 text-sm">{result.details}</p>
                  )}
                </div>

                {/* Test Case Details */}
                {result.testResults && (
                  <Tabs defaultValue="summary" className="w-full">
                    <TabsList>
                      <TabsTrigger value="summary">Summary</TabsTrigger>
                      <TabsTrigger value="details">Test Details</TabsTrigger>
                    </TabsList>

                    <TabsContent value="summary" className="space-y-2">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center p-3 bg-muted rounded">
                          <div className="font-semibold">Passed</div>
                          <div className="text-2xl text-green-600">{result.passedTests}</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded">
                          <div className="font-semibold">Total</div>
                          <div className="text-2xl">{result.totalTests}</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded">
                          <div className="font-semibold">Success Rate</div>
                          <div className="text-2xl">
                            {Math.round((result.passedTests / result.totalTests) * 100)}%
                          </div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded">
                          <div className="font-semibold">Time</div>
                          <div className="text-2xl">{result.executionTime || 0}ms</div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="details" className="space-y-2">
                      <div className="space-y-2 max-h-[400px] overflow-auto">
                        {result.testResults.map((test, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded border ${test.passed
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                              }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">Test Case {index + 1}</span>
                              {test.passed ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                              <div>
                                <div className="font-medium">Input:</div>
                                <pre className="bg-white p-2 rounded border overflow-auto">
                                  {test.input || 'No input'}
                                </pre>
                              </div>
                              <div>
                                <div className="font-medium">Expected:</div>
                                <pre className="bg-white p-2 rounded border overflow-auto">
                                  {test.expectedOutput}
                                </pre>
                              </div>
                              <div>
                                <div className="font-medium">
                                  {test.passed ? 'Output:' : 'Your Output:'}
                                </div>
                                <pre className="bg-white p-2 rounded border overflow-auto">
                                  {test.actualOutput || test.error || 'No output'}
                                </pre>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompetitiveProgrammingJudge;
