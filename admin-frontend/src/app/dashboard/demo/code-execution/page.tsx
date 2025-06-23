"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Clock, Loader2, Play, RotateCcw, Square, Trash2, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Monaco Editor (already installed)
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  { ssr: false }
);

// Language mappings for our FastAPI service
const LANGUAGE_MAPPINGS = {
  javascript: { id: 'javascript', name: 'JavaScript', monacoId: 'javascript' },
  python: { id: 'python', name: 'Python', monacoId: 'python' },
  java: { id: 'java', name: 'Java', monacoId: 'java' },
  cpp: { id: 'cpp', name: 'C++', monacoId: 'cpp' },
  csharp: { id: 'csharp', name: 'C#', monacoId: 'csharp' },
  go: { id: 'go', name: 'Go', monacoId: 'go' },
  rust: { id: 'rust', name: 'Rust', monacoId: 'rust' }
};

// Default code examples
const DEFAULT_CODE = {
  javascript: `// JavaScript Example
console.log("Hello, World!");

function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

for (let i = 0; i < 10; i++) {
    console.log(\`fibonacci(\${i}) = \${fibonacci(i)}\`);
}`,

  python: `# Python Example
print("Hello, World!")

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

for i in range(10):
    print(f"fibonacci({i}) = {fibonacci(i)}")`,

  java: `// Java Example
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        for (int i = 0; i < 10; i++) {
            System.out.println("fibonacci(" + i + ") = " + fibonacci(i));
        }
    }
    
    public static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
}`,

  cpp: `// C++ Example
#include <iostream>
using namespace std;

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    cout << "Hello, World!" << endl;
    
    for (int i = 0; i < 10; i++) {
        cout << "fibonacci(" << i << ") = " << fibonacci(i) << endl;
    }
    
    return 0;
}`,

  csharp: `// C# Example
using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
        
        for (int i = 0; i < 10; i++) {
            Console.WriteLine($"fibonacci({i}) = {Fibonacci(i)}");
        }
    }
    
    static int Fibonacci(int n) {
        if (n <= 1) return n;
        return Fibonacci(n - 1) + Fibonacci(n - 2);
    }
}`,

  go: `// Go Example
package main

import "fmt"

func fibonacci(n int) int {
    if n <= 1 {
        return n
    }
    return fibonacci(n-1) + fibonacci(n-2)
}

func main() {
    fmt.Println("Hello, World!")
    
    for i := 0; i < 10; i++ {
        fmt.Printf("fibonacci(%d) = %d\\n", i, fibonacci(i))
    }
}`,

  rust: `// Rust Example
fn fibonacci(n: u32) -> u32 {
    match n {
        0 | 1 => n,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

fn main() {
    println!("Hello, World!");
    
    for i in 0..10 {
        println!("fibonacci({}) = {}", i, fibonacci(i));
    }
}`
};

// Execution status types
type ExecutionStatus = 'idle' | 'pending' | 'running' | 'completed' | 'error';

interface ExecutionResult {
  execution_id: string;
  status: ExecutionStatus;
  output?: string;
  error_output?: string;
  execution_time?: string;
  memory_usage?: string;
  created_at?: string;
  completed_at?: string;
}

// Firebase auth context (you may need to adjust this based on your auth setup)
const useAuth = () => {
  // This is a placeholder - replace with your actual Firebase auth hook
  const [user] = useState<any>(null);
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    // Initialize Firebase auth here
    // For demo purposes, we'll use a placeholder token
    // In production, replace this with actual Firebase auth
    setToken('demo-firebase-jwt-token-replace-with-real-auth');
  }, []);

  return { user, token };
};

// Code Execution Service Class
class CodeExecutionService {
  private static readonly BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://your-production-domain.com/api/v1'
    : 'http://localhost:8001/api/v1';

  static async executeCode(code: string, language: string, inputData: string = '', token: string): Promise<ExecutionResult> {
    if (!token || token === 'demo-firebase-jwt-token-replace-with-real-auth') {
      throw new Error('Please configure Firebase authentication first');
    }

    const response = await fetch(`${this.BASE_URL}/executions/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        code: code.trim(),
        language,
        input_data: inputData.trim()
      })
    }); if (!response.ok) {
      let errorMessage = 'Execution failed';
      try {
        const error = await response.json();
        errorMessage = error.detail || error.message || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  }

  static async getExecutionStatus(executionId: string, token: string): Promise<ExecutionResult> {
    if (!token || token === 'demo-firebase-jwt-token-replace-with-real-auth') {
      throw new Error('Please configure Firebase authentication first');
    }

    const response = await fetch(`${this.BASE_URL}/executions/status/${executionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }); if (!response.ok) {
      let errorMessage = 'Failed to get execution status';
      try {
        const error = await response.json();
        errorMessage = error.detail || error.message || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  }

  static createWebSocketConnection(executionId: string, token: string): WebSocket {
    const wsUrl = this.BASE_URL.replace('http', 'ws');
    return new WebSocket(`${wsUrl}/executions/ws/${executionId}?token=${encodeURIComponent(token)}`);
  }

  static validateCode(code: string, language: string): string | null {
    if (!code.trim()) {
      return 'Please enter some code to execute';
    }

    // Basic validation based on language
    switch (language) {
      case 'python':
        if (!code.includes('print') && !code.includes('input') && !code.includes('return')) {
          return 'Python code should contain at least one print statement or function';
        }
        break;
      case 'javascript':
        if (!code.includes('console.log') && !code.includes('return') && !code.includes('alert')) {
          return 'JavaScript code should contain at least one console.log or return statement';
        }
        break;
      case 'java':
        if (!code.includes('public static void main') && !code.includes('System.out')) {
          return 'Java code should contain a main method or System.out statement';
        }
        break;
    }

    return null; // Valid
  }
}

// Main Component
export default function CodeExecutionPage() {
  const { token } = useAuth();
  const [language, setLanguage] = useState<string>('python');
  const [code, setCode] = useState<string>(DEFAULT_CODE.python);
  const [inputData, setInputData] = useState<string>('');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [error, setError] = useState<string>('');
  const [executionHistory, setExecutionHistory] = useState<ExecutionResult[]>([]);

  const wsRef = useRef<WebSocket | null>(null);

  // Handle language change
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setCode(DEFAULT_CODE[newLanguage as keyof typeof DEFAULT_CODE] || '');
  };
  // Execute code
  const executeCode = async () => {
    if (!token) {
      setError('Please authenticate first. Configure Firebase authentication.');
      return;
    }

    // Validate code
    const validationError = CodeExecutionService.validateCode(code, language);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setStatus('pending');
      setError('');
      setResult(null);

      // Submit code for execution
      const executionResult = await CodeExecutionService.executeCode(code, language, inputData, token);

      setResult(executionResult);
      setStatus('running');

      // Set up WebSocket for real-time updates
      const ws = CodeExecutionService.createWebSocketConnection(executionResult.execution_id, token);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          console.log('WebSocket update:', update);

          if (update.data) {
            setResult(update.data);
            setStatus(update.data.status);

            if (update.data.status === 'completed' || update.data.status === 'error') {
              setExecutionHistory(prev => [update.data, ...prev.slice(0, 9)]); // Keep last 10
              ws.close();
            }
          }
        } catch (parseError) {
          console.error('WebSocket message parse error:', parseError);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Real-time connection failed - falling back to polling');
      };

      ws.onclose = () => {
        wsRef.current = null;
      };

      // Fallback: Poll for status if WebSocket fails
      const pollInterval = setInterval(async () => {
        try {
          const statusResult = await CodeExecutionService.getExecutionStatus(executionResult.execution_id, token);
          setResult(statusResult);
          setStatus(statusResult.status);

          if (statusResult.status === 'completed' || statusResult.status === 'error') {
            clearInterval(pollInterval);
            setExecutionHistory(prev => [statusResult, ...prev.slice(0, 9)]);
          }
        } catch (err: any) {
          console.error('Status polling error:', err);
          clearInterval(pollInterval);
          setError(`Failed to get execution status: ${err.message}`);
          setStatus('error');
        }
      }, 2000);

      // Clean up polling after 60 seconds
      setTimeout(() => {
        clearInterval(pollInterval);
        if (status === 'running') {
          setError('Execution timeout - the code took too long to execute');
          setStatus('error');
        }
      }, 60000);

    } catch (err: any) {
      setError(err.message || 'Execution failed');
      setStatus('error');
    }
  };
  // Stop execution
  const stopExecution = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setStatus('idle');
    setError('Execution stopped by user');
  };

  // Clear all data
  const clearAll = () => {
    setResult(null);
    setError('');
    setExecutionHistory([]);
    setStatus('idle');
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  // Reset code to default for current language
  const resetCode = () => {
    setCode(DEFAULT_CODE[language as keyof typeof DEFAULT_CODE] || '');
    setInputData('');
    setError('');
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case 'pending':
      case 'running':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Code Execution</h1>
        <p className="text-muted-foreground">
          Execute code in multiple programming languages using our FastAPI service
        </p>
      </div>

      {/* Main Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Code Editor</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={getStatusColor()}>
                {getStatusIcon()}
                <span className="ml-1 capitalize">{status}</span>
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Language Selection */}
          <div className="flex items-center space-x-4">
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LANGUAGE_MAPPINGS).map(([key, lang]) => (
                  <SelectItem key={key} value={key}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1" />
            {/* Action Buttons */}
            <Button
              onClick={executeCode}
              disabled={status === 'pending' || status === 'running'}
              className="flex items-center space-x-2"
            >
              <Play className="h-4 w-4" />
              <span>Run Code</span>
            </Button>

            {(status === 'pending' || status === 'running') && (
              <Button
                onClick={stopExecution}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Square className="h-4 w-4" />
                <span>Stop</span>
              </Button>
            )}

            <Button
              onClick={resetCode}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </Button>

            <Button
              onClick={clearAll}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear</span>
            </Button>
          </div>

          {/* Code Editor */}
          <div className="border rounded-lg overflow-hidden">
            <MonacoEditor
              height="400px"
              language={LANGUAGE_MAPPINGS[language as keyof typeof LANGUAGE_MAPPINGS]?.monacoId || 'javascript'}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                wordWrap: 'on'
              }}
            />
          </div>

          {/* Input Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Standard Input (optional):</label>
            <Textarea
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder="Enter input data for your program..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Result */}
        <Card>
          <CardHeader>
            <CardTitle>Output</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">
                {error}
              </div>
            )}

            {result && (
              <Tabs defaultValue="output" className="w-full">
                <TabsList>
                  <TabsTrigger value="output">Output</TabsTrigger>
                  <TabsTrigger value="errors">Errors</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="output" className="mt-4">
                  <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-60">
                    {result.output || 'No output'}
                  </pre>
                </TabsContent>

                <TabsContent value="errors" className="mt-4">
                  <pre className="bg-red-50 p-4 rounded-lg text-sm text-red-700 overflow-auto max-h-60">
                    {result.error_output || 'No errors'}
                  </pre>
                </TabsContent>

                <TabsContent value="details" className="mt-4">
                  <div className="space-y-2 text-sm">
                    <div><strong>Execution ID:</strong> {result.execution_id}</div>
                    <div><strong>Status:</strong> <Badge variant="outline">{result.status}</Badge></div>
                    {result.execution_time && (
                      <div><strong>Execution Time:</strong> {result.execution_time}</div>
                    )}
                    {result.memory_usage && (
                      <div><strong>Memory Usage:</strong> {result.memory_usage}</div>
                    )}
                    {result.created_at && (
                      <div><strong>Created:</strong> {new Date(result.created_at).toLocaleString()}</div>
                    )}
                    {result.completed_at && (
                      <div><strong>Completed:</strong> {new Date(result.completed_at).toLocaleString()}</div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* Execution History */}
        <Card>
          <CardHeader>
            <CardTitle>Execution History</CardTitle>
          </CardHeader>
          <CardContent>
            {executionHistory.length === 0 ? (
              <p className="text-muted-foreground text-sm">No executions yet</p>
            ) : (<div className="space-y-2 max-h-60 overflow-auto">
              {executionHistory.map((execution) => (
                <div key={execution.execution_id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <Badge variant="outline" className={execution.status === 'completed' ? 'bg-green-50' : 'bg-red-50'}>
                      {execution.status}
                    </Badge>
                    <span className="text-muted-foreground">
                      {execution.completed_at ? new Date(execution.completed_at).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {execution.execution_id}
                  </div>
                </div>
              ))}
            </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Start the FastAPI Service</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Ensure the FastAPI code execution service is running on <code className="bg-muted px-1 rounded">http://localhost:8001</code>
            </p>
            <pre className="bg-muted p-3 rounded text-sm">
              {`# From project root directory
cd code-execution-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# Or using Docker Compose
docker-compose -f docker-compose.dev.yml up code-execution-service`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. Configure Firebase Authentication</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Replace the demo token with real Firebase authentication:
            </p>
            <pre className="bg-muted p-3 rounded text-sm">
              {`// In useAuth hook
const { user, idToken } = useAuthState(auth);
setToken(idToken || '');`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. Configure Environment Variables</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Update your <code className="bg-muted px-1 rounded">.env.dev</code> file in the project root:
            </p>
            <pre className="bg-muted p-3 rounded text-sm">
              {`CODE_EXECUTION_PORT=8001
CODE_EXECUTION_API_KEY=your_onlinecompiler_api_key
REDIS_URL=redis://localhost:6379/1`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">4. Features</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Monaco Editor with syntax highlighting for 7+ languages</li>
              <li>• Real-time execution updates via WebSocket</li>
              <li>• Standard input support for interactive programs</li>
              <li>• Execution history tracking with timestamps</li>
              <li>• Error handling and timeout protection</li>
              <li>• Firebase JWT authentication</li>
              <li>• Stateless execution with Redis for temporary state</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">5. Service Health Check</h3>
            <p className="text-sm text-muted-foreground">
              Verify the service is running: <a
                href="http://localhost:8001/health"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                http://localhost:8001/health
              </a>
            </p>
          </div>
        </CardContent>
      </Card>    </div>
  );
}
