import React, { createContext, useContext, useCallback, useState } from 'react';
import { 
  useAsyncCodeExecution, 
  UseAsyncCodeExecutionOptions 
} from './hooks';
import { JobStatus } from './service';

export interface CodeExecutionJob extends JobStatus {
  nodeId?: string; // ID of the code block node
  timestamp: Date;
}

export interface CodeExecutionContextValue {
  // Global execution state
  activeJobs: Map<string, CodeExecutionJob>;
  globalExecutionCount: number;
  
  // Execution methods
  executeCodeBlock: (
    nodeId: string, 
    code: string, 
    language: string, 
    options?: UseAsyncCodeExecutionOptions
  ) => Promise<JobStatus | null>;
  
  cancelCodeBlock: (nodeId: string) => Promise<void>;
  cancelAllExecutions: () => Promise<void>;
  
  // State queries
  isNodeExecuting: (nodeId: string) => boolean;
  getNodeJob: (nodeId: string) => CodeExecutionJob | undefined;
  hasActiveExecutions: () => boolean;
  
  // History management
  getExecutionHistory: () => CodeExecutionJob[];
  clearExecutionHistory: () => void;
  
  // Event handlers
  onJobStart?: (nodeId: string, job: CodeExecutionJob) => void;
  onJobComplete?: (nodeId: string, job: CodeExecutionJob) => void;
  onJobError?: (nodeId: string, error: Error) => void;
}

const CodeExecutionContext = createContext<CodeExecutionContextValue | null>(null);

export interface CodeExecutionProviderProps {
  children: React.ReactNode;
  maxConcurrentJobs?: number;
  defaultMaxRetries?: number;
  onJobStart?: (nodeId: string, job: CodeExecutionJob) => void;
  onJobComplete?: (nodeId: string, job: CodeExecutionJob) => void;
  onJobError?: (nodeId: string, error: Error) => void;
}

export const CodeExecutionProvider: React.FC<CodeExecutionProviderProps> = ({
  children,
  maxConcurrentJobs = 3,
  defaultMaxRetries = 5,
  onJobStart,
  onJobComplete,
  onJobError
}) => {
  const [activeJobs, setActiveJobs] = useState<Map<string, CodeExecutionJob>>(new Map());
  const [globalExecutionCount, setGlobalExecutionCount] = useState(0);
  const [executionHistory, setExecutionHistory] = useState<CodeExecutionJob[]>([]);
  // Create a single execution instance for managing global state
  const mainExecution = useAsyncCodeExecution({
    maxRetries: defaultMaxRetries,
    onProgress: (status) => {
      console.log('Execution progress:', status);
    },
    onComplete: (result) => {
      console.log('Execution completed:', result);
    },
    onError: (error) => {
      console.error('Execution error:', error);
    }
  });const executeCodeBlock = useCallback(async (
    nodeId: string,
    code: string,
    language: string,
  ): Promise<JobStatus | null> => {
    // Check if this node is already executing
    if (activeJobs.has(nodeId)) {
      console.warn(`Code block ${nodeId} is already executing`);
      return null;
    }

    // Check concurrent job limit
    if (activeJobs.size >= maxConcurrentJobs) {
      throw new Error(`Maximum concurrent executions (${maxConcurrentJobs}) reached. Please wait for other executions to complete.`);
    }

    try {
      // Increment global counter
      setGlobalExecutionCount(prev => prev + 1);

      // Call start callback
      if (onJobStart) {
        const tempJob: CodeExecutionJob = {
          execution_id: 'pending',
          status: 'waiting',
          nodeId,
          timestamp: new Date()
        };
        onJobStart(nodeId, tempJob);
      }

      // Execute the code using a custom hook instance with callbacks to track the job
      const result = await mainExecution.executeCode(code, language);

      if (result) {
        // Create the final job entry
        const completedJob: CodeExecutionJob = {
          ...result,
          nodeId,
          timestamp: new Date()
        };

        // Add to active jobs temporarily for tracking
        setActiveJobs(prev => new Map(prev).set(nodeId, completedJob));

        // Add to history
        setExecutionHistory(prev => [completedJob, ...prev.slice(0, 49)]); // Keep last 50

        // Remove from active jobs immediately since it's complete
        setTimeout(() => {
          setActiveJobs(prev => {
            const newMap = new Map(prev);
            newMap.delete(nodeId);
            return newMap;
          });
        }, 100);

        // Call completion callback
        if (onJobComplete) {
          onJobComplete(nodeId, completedJob);
        }

        return result;
      }

      return null;
    } catch (error) {
      throw error;
    }
  }, [activeJobs, maxConcurrentJobs, mainExecution, onJobStart, onJobComplete]);

  const cancelCodeBlock = useCallback(async (nodeId: string) => {
    const job = activeJobs.get(nodeId);
    if (!job) {
      console.warn(`No active job found for node ${nodeId}`);
      return;
    }

    try {
      // Cancel the specific job if possible
      // Note: The current service doesn't support per-job cancellation easily
      // This would need enhancement in the service layer
      await mainExecution.cancelExecution();
      
      // Remove from active jobs
      setActiveJobs(prev => {
        const newMap = new Map(prev);
        newMap.delete(nodeId);
        return newMap;
      });

      console.log(`Cancelled execution for node ${nodeId}`);
    } catch (error) {
      console.error(`Failed to cancel execution for node ${nodeId}:`, error);
      throw error;
    }
  }, [activeJobs, mainExecution]);

  const cancelAllExecutions = useCallback(async () => {
    try {
      await mainExecution.cancelExecution();
      setActiveJobs(new Map());
      console.log('Cancelled all active executions');
    } catch (error) {
      console.error('Failed to cancel all executions:', error);
      throw error;
    }
  }, [mainExecution]);

  const isNodeExecuting = useCallback((nodeId: string): boolean => {
    return activeJobs.has(nodeId);
  }, [activeJobs]);

  const getNodeJob = useCallback((nodeId: string): CodeExecutionJob | undefined => {
    return activeJobs.get(nodeId);
  }, [activeJobs]);

  const hasActiveExecutions = useCallback((): boolean => {
    return activeJobs.size > 0;
  }, [activeJobs]);

  const getExecutionHistory = useCallback((): CodeExecutionJob[] => {
    return executionHistory;
  }, [executionHistory]);

  const clearExecutionHistory = useCallback(() => {
    setExecutionHistory([]);
  }, []);

  const contextValue: CodeExecutionContextValue = {
    activeJobs,
    globalExecutionCount,
    executeCodeBlock,
    cancelCodeBlock,
    cancelAllExecutions,
    isNodeExecuting,
    getNodeJob,
    hasActiveExecutions,
    getExecutionHistory,
    clearExecutionHistory,
    onJobStart,
    onJobComplete,
    onJobError
  };

  return (
    <CodeExecutionContext.Provider value={contextValue}>
      {children}
    </CodeExecutionContext.Provider>
  );
};

export const useCodeExecutionContext = (): CodeExecutionContextValue => {
  const context = useContext(CodeExecutionContext);
  if (!context) {
    throw new Error('useCodeExecutionContext must be used within a CodeExecutionProvider');
  }
  return context;
};

export default CodeExecutionContext;
