"use client";

import { UseFormSetError } from 'react-hook-form';
import { showToast } from './error-handler';
import { Log } from './log';

/**
 * DRF standardized error format
 * Based on drf-standardized-errors package format
 */
interface DRFFieldError {
    attr: string;
    code: string;
    detail: string;
}

interface DRFErrorResponse {
    type: 'validation_error' | 'client_error' | 'server_error';
    errors: DRFFieldError[];
    [key: string]: any;
}

/**
 * Error handling options
 */
interface DRFErrorHandlerOptions {
    form?: {
        setError: UseFormSetError<any>;
        clearErrors?: (name?: any) => void;
    };
    displayType?: 'toast' | 'inline' | 'both' | 'none';
    toastOptions?: {
        showNonFieldErrors?: boolean;
        showFieldErrors?: boolean;
        showGeneralErrors?: boolean;
    };
    customMessages?: {
        fallback?: string;
        networkError?: string;
        validationError?: string;
    };
}

/**
 * Result of error handling operation
 */
interface DRFErrorHandlerResult {
    type: 'validation' | 'network' | 'server' | 'unknown';
    data: {
        success: boolean;
        nonFieldErrors: string[];
        fieldErrorsApplied: number;
        totalErrors: number;
        validationErrors: Array<{ field: string; message: string; code?: string }>;
        hasErrors: boolean;
        hasFieldErrors: boolean;
        hasNonFieldErrors: boolean;
    };
}

/**
 * Comprehensive DRF Error Handler Class
 * Provides unified error handling for Django REST Framework responses
 * 
 * @example
 * ```typescript
 * const result = DRFErrorHandler.handle(error, {
 *   form: { setError: form.setError },
 *   displayType: 'both'
 * });
 * 
 * if (result.data.hasErrors) {
 *   console.log(`Found ${result.data.totalErrors} errors`);
 *   console.log('Field errors:', result.data.validationErrors);
 *   console.log('Non-field errors:', result.data.nonFieldErrors);
 * }
 * ```
 */
export class DRFErrorHandler {    /**
     * Default options for error handling
     */
    private static defaultOptions: Required<DRFErrorHandlerOptions> = {
        form: undefined as any,
        displayType: 'both',
        toastOptions: {
            showNonFieldErrors: true,
            showFieldErrors: false,
            showGeneralErrors: true,
        },
        customMessages: {
            fallback: 'An unexpected error occurred.',
            networkError: 'Network error. Please check your connection.',
            validationError: 'Validation error occurred. ',
        },
    };    /**
     * Main error handling function
     * Processes DRF errors and applies them according to options
     */
    static handle(
        error: any,
        options: DRFErrorHandlerOptions = {}
    ): DRFErrorHandlerResult {
        const opts = this.mergeOptions(options);
        const result: DRFErrorHandlerResult = {
            type: 'unknown',
            data: {
                success: false,
                nonFieldErrors: [],
                fieldErrorsApplied: 0,
                totalErrors: 0,
                validationErrors: [],
                hasErrors: false,
                hasFieldErrors: false,
                hasNonFieldErrors: false,
            },
        };

        if (!error) {
            return result;
        }

        try {
            // Parse the error response
            const parsedError = this.parseError(error);
            result.type = parsedError.type;
            result.data.success = parsedError.success;
            result.data.nonFieldErrors = parsedError.nonFieldErrors;
            result.data.fieldErrorsApplied = parsedError.fieldErrors.length;
            result.data.totalErrors = parsedError.nonFieldErrors.length + parsedError.fieldErrors.length;
            result.data.validationErrors = parsedError.fieldErrors.map(fe => ({
                field: fe.field,
                message: fe.message,
                code: 'server'
            }));
            result.data.hasErrors = result.data.totalErrors > 0;
            result.data.hasFieldErrors = parsedError.fieldErrors.length > 0;
            result.data.hasNonFieldErrors = parsedError.nonFieldErrors.length > 0;

            // Apply field errors to form if form is provided
            if (opts.form && parsedError.fieldErrors.length > 0) {
                this.applyFieldErrors(parsedError.fieldErrors, opts.form.setError);
            }

            // Handle display according to displayType
            this.handleDisplay(parsedError, opts);

        } catch (parseError) {
            Log.warn('Failed to parse DRF error response:', parseError);
            result.type = 'unknown';
            result.data.nonFieldErrors = [opts.customMessages.fallback!];
            result.data.totalErrors = 1;
            result.data.hasErrors = true;
            result.data.hasNonFieldErrors = true;

            if (opts.displayType === 'toast' || opts.displayType === 'both') {
                showToast('error', { message: opts.customMessages.fallback });
            }
        }

        return result;
    }    /**
     * Parse error response into standardized format
     */
    private static parseError(error: any): {
        success: boolean;
        type: 'validation' | 'network' | 'server' | 'unknown';
        fieldErrors: Array<{ field: string; message: string; code?: string }>;
        nonFieldErrors: string[];
    } {
        const result = {
            success: false,
            type: 'unknown' as 'validation' | 'network' | 'server' | 'unknown',
            fieldErrors: [] as Array<{ field: string; message: string; code?: string }>,
            nonFieldErrors: [] as string[],
        };

        // Handle network errors
        if (error.name === 'NetworkError' || error.status === 0) {
            result.type = 'network';
            result.nonFieldErrors.push(this.defaultOptions.customMessages.networkError!);
            return result;
        }

        // Handle server errors (5xx)
        if (error.status >= 500) {
            result.type = 'server';
            result.nonFieldErrors.push('Server error occurred. Please try again later.');
            return result;
        }
        
        if(error.status === 404) {
            result.type = 'server';
            result.nonFieldErrors.push('Resource not found. Please check the URL or try again later.');
            return result;
        }

        // Extract error data
        const errorData = error.data || error;

        // Handle DRF standardized errors format
        if (this.isDRFStandardizedError(errorData)) {
            result.type = 'validation';
            result.success = true;

            for (const fieldError of errorData.errors) {
                const fieldName = fieldError.attr;
                const message = fieldError.detail;
                const code = fieldError.code;

                if (!fieldName || fieldName === 'non_field_errors' || fieldName === '__all__') {
                    result.nonFieldErrors.push(message);
                } else {
                    result.fieldErrors.push({ field: fieldName, message, code });
                }
            }
        }
        // Handle string errors
        else if (typeof errorData === 'string') {
            result.type = 'validation';
            result.success = true;
            result.nonFieldErrors.push(errorData);
        }
        // Handle object with message/detail
        else if (errorData && typeof errorData === 'object') {
            result.type = 'validation';
            result.success = true;

            if (errorData.message && typeof errorData.message === 'string') {
                result.nonFieldErrors.push(errorData.message);
            } else if (errorData.detail && typeof errorData.detail === 'string') {
                result.nonFieldErrors.push(errorData.detail);
            } else {
                result.nonFieldErrors.push(this.defaultOptions.customMessages.fallback!);
            }
        }

        return result;
    }    /**
     * Apply field errors to react-hook-form
     */
    private static applyFieldErrors(
        fieldErrors: Array<{ field: string; message: string; code?: string }>,
        setError: UseFormSetError<any>
    ): void {
        for (const { field, message } of fieldErrors) {
            console.warn(`Setting error for field "${field}": ${message}`);
            setError(field as any, {
                type: 'server',
                message: message,
            });
        }
    }    /**
     * Handle error display according to options
     */
    private static handleDisplay(
        parsedError: ReturnType<typeof DRFErrorHandler.parseError>,
        options: Required<DRFErrorHandlerOptions>
    ): void {
        if (options.displayType === 'none') return;

        const { displayType, toastOptions, form } = options;
        const shouldShowToast = displayType === 'toast' || displayType === 'both';
        let toastShown = false;

        // Handle non-field errors
        if (parsedError.nonFieldErrors.length > 0) {
            const message = parsedError.nonFieldErrors.join(' ');

            // Set root error on form for inline display
            if ((displayType === 'inline' || displayType === 'both') && form) {
                form.setError('root' as any, {
                    type: 'server',
                    message: message,
                });
            }

            // Show toast notification - always show when toast is requested and non-field errors enabled
            if (shouldShowToast && toastOptions.showNonFieldErrors) {
                showToast('error', { message });
                toastShown = true;
            }
        }

        // Handle field errors toast (if enabled)
        if (parsedError.fieldErrors.length > 0 && shouldShowToast && toastOptions.showFieldErrors) {
            const fieldErrorMessage = `Validation errors in ${parsedError.fieldErrors.length} field(s)`;
            showToast('error', { message: fieldErrorMessage });
            toastShown = true;
        }

        // Always show a toast if displayType allows it and no toast has been shown yet
        if (shouldShowToast && !toastShown) {
            if (parsedError.nonFieldErrors.length === 0 && parsedError.fieldErrors.length === 0) {
                // No specific errors - show general error if enabled
                if (toastOptions.showGeneralErrors) {
                    showToast('error', { message: options.customMessages.fallback });
                }
            } else {
                // We have errors but no toast was shown due to toast options
                // Show a general validation error toast
                showToast('error', { message: options.customMessages.validationError });
            }
        }
    }/**
     * Extract a user-friendly error message from any error response
     */
    static extractMessage(error: any): string {
        if (!error) return this.defaultOptions.customMessages.fallback!;

        const errorData = error.data || error;        // Handle DRF standardized errors
        if (this.isDRFStandardizedError(errorData)) {
            const firstError = errorData.errors[0];
            if (firstError) {
                return firstError.detail || this.defaultOptions.customMessages.validationError!;
            }
        }

        // Handle string errors
        if (typeof errorData === 'string') {
            return errorData;
        }

        // Handle object with message/detail
        if (errorData && typeof errorData === 'object') {
            if (errorData.message && typeof errorData.message === 'string') {
                return errorData.message;
            }
            if (errorData.detail && typeof errorData.detail === 'string') {
                return errorData.detail;
            }
        }

        return this.defaultOptions.customMessages.fallback!;
    }    /**
     * Clear all server-side errors from form
     */
    static clearFormErrors(
        form: DRFErrorHandlerOptions['form'],
        fieldNames?: string[]
    ): void {
        if (!form) return;

        if (fieldNames) {
            fieldNames.forEach(fieldName => {
                if (form.clearErrors) {
                    form.clearErrors(fieldName);
                } else {
                    form.setError(fieldName as any, { message: undefined });
                }
            });
        }

        // Clear root errors
        if (form.clearErrors) {
            form.clearErrors('root');
        } else {
            form.setError('root' as any, { message: undefined });
        }
    }/**
     * Set a non-field error on the form
     */
    static setNonFieldError(
        form: DRFErrorHandlerOptions['form'],
        message: string
    ): void {
        if (!form) return;

        form.setError('root' as any, {
            type: 'server',
            message: message,
        });
    }    /**
     * Check if error response is in DRF standardized format
     */
    private static isDRFStandardizedError(error: any): error is DRFErrorResponse {
        return (
            error &&
            typeof error === 'object' &&
            'type' in error &&
            'errors' in error &&
            Array.isArray(error.errors)
        );
    }/**
     * Merge provided options with defaults
     */
    private static mergeOptions(
        options: DRFErrorHandlerOptions
    ): Required<DRFErrorHandlerOptions> {
        return {
            ...this.defaultOptions,
            ...options,
            toastOptions: {
                ...this.defaultOptions.toastOptions,
                ...options.toastOptions,
            },
            customMessages: {
                ...this.defaultOptions.customMessages,
                ...options.customMessages,
            },
        } as Required<DRFErrorHandlerOptions>;
    }
}
