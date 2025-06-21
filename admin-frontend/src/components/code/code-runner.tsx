"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Square, Download, Upload } from 'lucide-react';
import { useCodeExecution } from './hooks/useCodeExecution';
import { SUPPORTED_LANGUAGES, ExecutionResult, ExecutionStatus } from './types/code-runner.types';

interface CodeRunnerProps {
  initialCode?: string;
  initialLanguage?: string;
  className?: string;
}

export const CodeRunner: React.FC<CodeRunnerProps> = ({
  initialCode = '',
  initialLanguage = 'javascript',
  className = ''
}) => {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLanguage);
  const [input, setInput] = useState('');
  
  const {
    result,
    isExecuting,
    executeCode,
    stopExecution,
    executionHistory
  } = useCodeExecution();

  const handleRun = useCallback(async () => {
    if (!code.trim()) return;
    
    await executeCode({
      code,
      language,
      input
    });
  }, [code, language, input, executeCode]);

  const handleStop = useCallback(() => {
    stopExecution();
  }, [stopExecution]);

  const getStatusColor = (status: ExecutionStatus) => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'timeout':
        return 'bg-yellow-500';
      case 'memory_limit':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatExecutionTime = (time?: number) => {
    if (!time) return 'N/A';
    return time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(2)}s`;
  };

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.id} value={lang.id}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{lang.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {lang.version}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRun}
            disabled={isExecuting || !code.trim()}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {isExecuting ? 'Running...' : 'Run'}
          </Button>
          
          {isExecuting && (
            <Button
              onClick={handleStop}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Stop
            </Button>
          )}
        </div>
      </div>

      {/* Code Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Code Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`Enter your ${language} code here...`}
            className="min-h-[300px] font-mono text-sm"
            disabled={isExecuting}
          />
        </CardContent>
      </Card>

      {/* Input/Output Tabs */}
      <Tabs defaultValue="input" className="w-full">
        <TabsList>
          <TabsTrigger value="input">Input</TabsTrigger>
          <TabsTrigger value="output">Output</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="input" className="space-y-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Standard Input</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter input for your program..."
                className="min-h-[120px] font-mono text-sm"
                disabled={isExecuting}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="output" className="space-y-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Execution Result</CardTitle>
              {result && (
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(result.status)}>
                    {result.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatExecutionTime(result.executionTime)}
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!result && !isExecuting && (
                <div className="text-center py-8 text-muted-foreground">
                  Run your code to see the output
                </div>
              )}
              
              {isExecuting && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Executing code...</p>
                </div>
              )}
              
              {result && (
                <div className="space-y-4">
                  {result.output && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Output:</h4>
                      <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                        {result.output}
                      </pre>
                    </div>
                  )}
                  
                  {result.error && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-red-600">Error:</h4>
                      <pre className="bg-red-50 border border-red-200 p-3 rounded text-sm overflow-auto text-red-800">
                        {result.error}
                      </pre>
                    </div>
                  )}
                  
                  {result.compilationInfo && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Compilation Info:</h4>
                      <pre className="bg-blue-50 border border-blue-200 p-3 rounded text-sm overflow-auto">
                        {result.compilationInfo}
                      </pre>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-medium">Memory Used:</span> {result.memoryUsed || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">CPU Time:</span> {formatExecutionTime(result.executionTime)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Execution History</CardTitle>
            </CardHeader>
            <CardContent>
              {executionHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No execution history yet
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-auto">
                  {executionHistory.map((item, index) => (
                    <div
                      key={index}
                      className="border rounded p-3 text-sm space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(item.status)}>
                          {item.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="font-mono text-xs bg-muted p-2 rounded">
                        {item.language} • {formatExecutionTime(item.executionTime)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CodeRunner;
