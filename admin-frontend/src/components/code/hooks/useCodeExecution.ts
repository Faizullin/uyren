"use client";

import { useState, useCallback, useRef } from 'react';
import { ExecutionRequest, ExecutionResult } from '../types/code-runner.types';
import { codeExecutionService } from '../services/code-execution.service';

interface UseCodeExecutionReturn {
  result: ExecutionResult | null;
  isExecuting: boolean;
  executeCode: (request: ExecutionRequest) => Promise<void>;
  stopExecution: () => void;
  executionHistory: ExecutionResult[];
  clearHistory: () => void;
}

export const useCodeExecution = (): UseCodeExecutionReturn => {
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionHistory, setExecutionHistory] = useState<ExecutionResult[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const executeCode = useCallback(async (request: ExecutionRequest): Promise<void> => {
    if (isExecuting) {
      console.warn('Code execution already in progress');
      return;
    }

    setIsExecuting(true);
    setResult(null);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const executionResult = await codeExecutionService.executeCode(request);
      
      // Check if execution was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setResult(executionResult);
      
      // Add to history (keep last 10 executions)
      setExecutionHistory(prev => {
        const newHistory = [executionResult, ...prev];
        return newHistory.slice(0, 10);
      });

    } catch (error) {
      // Check if execution was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      const errorResult: ExecutionResult = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: Date.now(),
        language: request.language,
        executionTime: 0
      };

      setResult(errorResult);
      
      // Add error to history
      setExecutionHistory(prev => {
        const newHistory = [errorResult, ...prev];
        return newHistory.slice(0, 10);
      });

    } finally {
      setIsExecuting(false);
      abortControllerRef.current = null;
    }
  }, [isExecuting]);

  const stopExecution = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsExecuting(false);
  }, []);

  const clearHistory = useCallback(() => {
    setExecutionHistory([]);
  }, []);

  return {
    result,
    isExecuting,
    executeCode,
    stopExecution,
    executionHistory,
    clearHistory
  };
};
