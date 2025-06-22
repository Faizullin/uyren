import { ApiError } from './api';
import { AuthService } from './auth-service';

// Global error handler for API errors
export class GlobalErrorHandler {
  /**
   * Handle global API errors based on status codes
   */
  static handleError(error: unknown): void {
    if (!(error instanceof ApiError)) {
      console.error('Non-API error:', error);
      return;
    }

    console.error('API Error:', {
      status: error.status,
      message: error.message,
      url: error.url,
      data: error.data
    });

    switch (error.status) {
      case 401:
        this.handleUnauthorized(error);
        break;
      case 403:
        this.handleForbidden(error);
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        this.handleServerError(error);
        break;
      default:
        this.handleGenericError(error);
        break;
    }
  }

  /**
   * Handle 401 Unauthorized errors
   */
  private static handleUnauthorized(error: ApiError): void {
    console.warn('Unauthorized access - clearing auth data and redirecting to login');
    
    // Clear authentication data
    AuthService.signOut().catch(console.error);
    
    // Show user-friendly message
    this.showErrorNotification(
      'Session Expired',
      'Your session has expired. Please sign in again.',
      'warning'
    );

    // Redirect to sign-in page after a short delay
    setTimeout(() => {
      window.location.href = '/sign-in';
    }, 1500);
  }

  /**
   * Handle 403 Forbidden errors
   */
  private static handleForbidden(error: ApiError): void {
    console.warn('Access forbidden:', error.message);
    
    this.showErrorNotification(
      'Access Denied',
      'You do not have permission to perform this action.',
      'error'
    );
  }

  /**
   * Handle 5xx Server errors
   */
  private static handleServerError(error: ApiError): void {
    console.error('Server error:', error);
    
    const isMaintenanceMode = error.status === 503;
    const message = isMaintenanceMode 
      ? 'The service is temporarily unavailable. Please try again later.'
      : 'A server error occurred. Please try again or contact support if the problem persists.';

    this.showErrorNotification(
      'Server Error',
      message,
      'error'
    );
  }

  /**
   * Handle other API errors
   */
  private static handleGenericError(error: ApiError): void {
    console.error('API error:', error);
    
    // For client errors (4xx), show the server message
    if (error.isClientError()) {
      this.showErrorNotification(
        'Request Error',
        error.message,
        'error'
      );
    } else {
      // For network errors or unknown errors
      this.showErrorNotification(
        'Connection Error',
        'Unable to connect to the server. Please check your internet connection.',
        'error'
      );
    }
  }

  /**
   * Show error notification to user
   * This is a basic implementation - you can integrate with a toast library
   */
  private static showErrorNotification(
    title: string,
    message: string,
    type: 'error' | 'warning' | 'info' = 'error'
  ): void {
    // For now, just log to console and show alert
    // In a real app, you'd integrate with a toast notification library
    console.error(`${title}: ${message}`);
    
    // You can uncomment this for development to see notifications
    // alert(`${title}\n\n${message}`);
    
    // TODO: Integrate with a proper notification system like:
    // - react-hot-toast
    // - react-toastify
    // - or a custom notification component
  }

  /**
   * Create a React Query error handler
   */
  static createQueryErrorHandler() {
    return (error: unknown) => {
      this.handleError(error);
    };
  }
}

// Export convenience function for React Query
export const globalQueryErrorHandler = GlobalErrorHandler.createQueryErrorHandler();
