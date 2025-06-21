"use client";

import React from 'react';
import { CodeRunner } from '@/components/code';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DEMO_CODES = {
  javascript: `// JavaScript Example - Fibonacci Sequence
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

for (let i = 0; i < 10; i++) {
    console.log(\`fibonacci(\${i}) = \${fibonacci(i)}\`);
}`,

  python: `# Python Example - Prime Numbers
def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True

# Find first 10 prime numbers
primes = []
num = 2
while len(primes) < 10:
    if is_prime(num):
        primes.append(num)
    num += 1

print("First 10 prime numbers:", primes)`,

  java: `// Java Example - Bubble Sort
public class Main {
    public static void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }
    
    public static void main(String[] args) {
        int[] arr = {64, 34, 25, 12, 22, 11, 90};
        System.out.print("Original array: ");
        for (int num : arr) {
            System.out.print(num + " ");
        }
        
        bubbleSort(arr);
        
        System.out.print("\\nSorted array: ");
        for (int num : arr) {
            System.out.print(num + " ");
        }
    }
}`,

  cpp: `// C++ Example - Binary Search
#include <iostream>
#include <vector>
#include <algorithm>

int binarySearch(const std::vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        
        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    return -1;
}

int main() {
    std::vector<int> arr = {2, 3, 4, 10, 40, 50, 60, 70};
    int target = 10;
    
    std::cout << "Array: ";
    for (int num : arr) {
        std::cout << num << " ";
    }
    
    int result = binarySearch(arr, target);
    
    if (result != -1) {
        std::cout << "\\nElement " << target << " found at index " << result << std::endl;
    } else {
        std::cout << "\\nElement " << target << " not found" << std::endl;
    }
    
    return 0;
}`
};

export default function CodeExecutionDemo() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Code Execution Demo</h1>
        <p className="text-muted-foreground">
          Try running code in different programming languages using the Ideone API
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interactive Code Runner</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="javascript" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="java">Java</TabsTrigger>
              <TabsTrigger value="cpp">C++</TabsTrigger>
            </TabsList>
            
            <TabsContent value="javascript" className="mt-4">
              <CodeRunner
                initialCode={DEMO_CODES.javascript}
                initialLanguage="javascript"
              />
            </TabsContent>
            
            <TabsContent value="python" className="mt-4">
              <CodeRunner
                initialCode={DEMO_CODES.python}
                initialLanguage="python"
              />
            </TabsContent>
            
            <TabsContent value="java" className="mt-4">
              <CodeRunner
                initialCode={DEMO_CODES.java}
                initialLanguage="java"
              />
            </TabsContent>
            
            <TabsContent value="cpp" className="mt-4">
              <CodeRunner
                initialCode={DEMO_CODES.cpp}
                initialLanguage="cpp"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Get Ideone API Credentials</h3>
            <p className="text-sm text-muted-foreground">
              Visit <a href="https://ideone.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ideone.com</a> to create an account and get your API credentials.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">2. Configure Environment</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Add your credentials to <code className="bg-muted px-1 rounded">.env.local</code>:
            </p>
            <pre className="bg-muted p-3 rounded text-sm">
{`NEXT_PUBLIC_IDEONE_USER=your_username
NEXT_PUBLIC_IDEONE_PASSWORD=your_password`}
            </pre>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">3. Features</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Support for 13+ programming languages</li>
              <li>• Real-time execution with output display</li>
              <li>• Error handling and compilation info</li>
              <li>• Execution history tracking</li>
              <li>• Memory and time usage monitoring</li>
              <li>• Standard input support</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
