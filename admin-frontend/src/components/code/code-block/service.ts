import { CODE_RUNNER_API_URL } from "@/constants/api";
import { AuthService } from "@/lib/auth-service";

export interface AsyncExecutionRequest {
    code: string;
    language: string;
    input_data?: string;
}

export interface AsyncExecutionResponse {
    execution_id: string;
    status: 'waiting' | 'running' | 'success' | 'error';
    message?: string;
}

export interface JobStatus {
    execution_id: string;
    status: 'waiting' | 'running' | 'success' | 'error';
    output?: string;
    error?: string;
    executionTime?: number;
    progress?: number;
}

export class AsyncCodeExecutionService {
    private static readonly API_BASE_URL = `${CODE_RUNNER_API_URL}/api/v1/executions`;
    private static readonly MAX_RETRIES = 5;
    private static readonly RETRY_DELAY = 2000; // 2 seconds

    /**
     * Get Firebase JWT token for authentication
     */
    private static async getAuthToken() {
        return await AuthService.getCurrentFirebaseUserToken()!;
    }

    /**
     * Submit code for asynchronous execution
     */
    static async submitExecution(request: AsyncExecutionRequest): Promise<AsyncExecutionResponse> {
        try {
            const authToken = await this.getAuthToken();

            const response = await fetch(`${this.API_BASE_URL}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    code: request.code,
                    language: request.language,
                    input_data: request.input_data || ''
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to submit code execution: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            throw new Error(`Submission failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Check the status of a job
     */
    static async getJobStatus(executionId: string): Promise<JobStatus> {
        try {
            const authToken = await this.getAuthToken();

            const response = await fetch(`${this.API_BASE_URL}/status/${executionId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to get job status: ${response.statusText}`);
            } const data = await response.json();
            return {
                execution_id: data.execution_id,
                status: data.status,
                output: data.output || '',
                error: data.error_output || '',
                executionTime: data.execution_time ? parseFloat(data.execution_time) * 1000 : undefined, // Convert to milliseconds
                progress: data.progress
            };
        } catch (error) {
            throw new Error(`Status check failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }    /**
     * Poll for job completion with retry logic
     */
    static async pollForCompletion(
        executionId: string,
        onProgress?: (status: JobStatus) => void,
        maxRetries: number = this.MAX_RETRIES
    ): Promise<JobStatus> {
        let attempts = 0;

        while (attempts < maxRetries) {
            try {
                const status = await this.getJobStatus(executionId);

                // Call progress callback if provided
                if (onProgress) {
                    onProgress(status);
                }                // If job is completed (success or error), return the result
                if (status.status === 'success' || status.status === 'error') {
                    return status;
                }

                // If still running or waiting, wait and retry
                attempts++;

                if (attempts < maxRetries) {
                    await this.delay(this.RETRY_DELAY);
                }
            } catch (error) {
                attempts++;

                if (attempts >= maxRetries) {
                    throw new Error(`Polling failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`);
                }

                // Wait before retrying
                await this.delay(this.RETRY_DELAY);
            }
        }

        throw new Error(`Job did not complete after ${maxRetries} attempts`);
    }

    /**
     * Submit code and wait for completion (combines submit + poll)
     */
    static async executeAndWait(
        request: AsyncExecutionRequest,
        onProgress?: (status: JobStatus) => void,
        maxRetries: number = this.MAX_RETRIES
    ): Promise<JobStatus> {
        // Submit the job
        const submission = await this.submitExecution(request);

        // Poll for completion
        return this.pollForCompletion(submission.execution_id, onProgress, maxRetries);
    }

    /**
     * Cancel a running job
     */
    static async cancelJob(executionId: string): Promise<void> {
        try {
            const authToken = await this.getAuthToken();

            const response = await fetch(`${this.API_BASE_URL}/cancel/${executionId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to cancel job: ${response.statusText}`);
            }
        } catch (error) {
            throw new Error(`Cancellation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }    /**
     * Utility function to delay execution
     */
    private static delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
