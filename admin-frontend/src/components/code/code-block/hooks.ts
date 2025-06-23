import { useState, useCallback, useRef, useEffect } from 'react';
import { AsyncCodeExecutionService, AsyncExecutionRequest, JobStatus } from './service';

export interface UseAsyncCodeExecutionOptions {
    maxRetries?: number;
    onProgress?: (status: JobStatus) => void;
    onComplete?: (result: JobStatus) => void;
    onError?: (error: Error) => void;
}

export interface UseAsyncCodeExecutionReturn {
    // State
    isExecuting: boolean;
    currentJob: JobStatus | null;
    error: Error | null;

    // Actions
    executeCode: (code: string, language: string) => Promise<JobStatus | null>;
    cancelExecution: () => Promise<void>;
    clearError: () => void;
}

export const useAsyncCodeExecution = (
    options: UseAsyncCodeExecutionOptions = {}
): UseAsyncCodeExecutionReturn => {
    const {
        maxRetries = 5,
        onProgress,
        onComplete,
        onError
    } = options;

    // State
    const [isExecuting, setIsExecuting] = useState(false);
    const [currentJob, setCurrentJob] = useState<JobStatus | null>(null);
    const [error, setError] = useState<Error | null>(null);

    // Refs for cleanup
    const abortControllerRef = useRef<AbortController | null>(null);
    const currentJobIdRef = useRef<string | null>(null);

    // Progress handler
    const handleProgress = useCallback((status: JobStatus) => {
        setCurrentJob(status);

        // Call external progress handler
        if (onProgress) {
            onProgress(status);
        }
    }, [onProgress]);

    // Main execution function
    const executeCode = useCallback(async (
        code: string,
        language: string
    ): Promise<JobStatus | null> => {
        try {
            // Clear previous error
            setError(null);
            setIsExecuting(true);

            // Create abort controller for cancellation
            abortControllerRef.current = new AbortController();

            const request: AsyncExecutionRequest = {
                code,
                language
            };

            // Submit the job
            console.log('Submitting code execution...', { code: code.substring(0, 100) + '...', language });
            const submission = await AsyncCodeExecutionService.submitExecution(request);

            currentJobIdRef.current = submission.execution_id;
            setCurrentJob({
                execution_id: submission.execution_id,
                status: submission.status,
            });

            // Start polling for completion
            console.log('Starting to poll for completion...', submission.execution_id);
            const result = await AsyncCodeExecutionService.pollForCompletion(
                submission.execution_id,
                handleProgress,
                maxRetries
            );

            setIsExecuting(false);
            setCurrentJob(result);
            currentJobIdRef.current = null;

            // Call completion handler
            if (onComplete) {
                onComplete(result);
            }

            console.log('Code execution completed', result);
            return result;

        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            console.error('Code execution failed:', error);

            setError(error);
            setIsExecuting(false);
            currentJobIdRef.current = null;

            // Call error handler
            if (onError) {
                onError(error);
            }

            return null;
        }
    }, [maxRetries, onComplete, onError, handleProgress]);

    // Cancel execution
    const cancelExecution = useCallback(async () => {
        try {
            // Abort any ongoing requests
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Cancel the job on the server if we have a job ID
            if (currentJobIdRef.current) {
                await AsyncCodeExecutionService.cancelJob(currentJobIdRef.current);
            }

            // Reset state
            setIsExecuting(false);
            setCurrentJob(null);
            currentJobIdRef.current = null;

            console.log('Code execution cancelled');
        } catch (err) {
            console.error('Failed to cancel execution:', err);
            // Don't throw here, just log the error
        }
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return {
        // State
        isExecuting,
        currentJob,
        error,

        // Actions
        executeCode,
        cancelExecution,
        clearError
    };
};
