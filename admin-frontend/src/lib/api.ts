import { API_BASE_URL } from "@/constants/api";
import { AuthService } from "./auth-service";

interface RequestOptions extends RequestInit {
  token?: string;
  params?: Record<string, any>;
}

// Custom API Error class for detailed error handling
export class ApiError extends Error {
  public status: number;
  public statusText: string;
  public data: any;
  public url: string;

  constructor(
    message: string,
    status: number,
    statusText: string,
    data: any = null,
    url: string = ''
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
    this.url = url;
  }

  // Helper methods to check error types
  isUnauthorized() {
    return this.status === 401;
  }

  isForbidden() {
    return this.status === 403;
  }

  isServerError() {
    return this.status >= 500;
  }

  isClientError() {
    return this.status >= 400 && this.status < 500;
  }
}

// API base URL - adjust this to match your Django backend
const API_PREFIX = "/api/v1";
const APU_URL = `${API_BASE_URL}${API_PREFIX}`;

// Helper function to build URL with query parameters
function buildUrlWithParams(baseUrl: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return baseUrl;
  }

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        // Handle arrays by adding multiple entries with the same key
        value.forEach(item => searchParams.append(key, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export async function simpleRequest<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, headers, params, body, ...restOptions } = options;
  // Build URL with query parameters
  const urlWithParams = buildUrlWithParams(url, params);
  const fullUrl = `${APU_URL}${urlWithParams}`;

  // Check if body is FormData
  const isFormData = body instanceof FormData;

  // Default headers
  const defaultHeaders: Record<string, string> = {};

  // Only set Content-Type for non-FormData requests
  if (!isFormData) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  // Add authorization header if token is provided
  if (token) {
    // Use Django's Token authentication format
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  // Merge headers (but don't override Content-Type for FormData)
  const mergedHeaders: any = {
    ...defaultHeaders,
    ...headers,
  };

  // Remove Content-Type for FormData to let browser set it with boundary
  if (isFormData && mergedHeaders["Content-Type"]) {
    delete mergedHeaders["Content-Type"];
  }

  try {
    const response = await fetch(fullUrl, {
      ...restOptions,
      headers: mergedHeaders,
      body,
    });

    if (!response.ok) {
      let errorData: any = {};
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        errorData = await response.json();
        // Use server-provided error message if available
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } catch (parseError) {
        // If response body is not JSON, use default message
        console.warn('Failed to parse error response:', parseError);
      }

      throw new ApiError(
        errorMessage,
        response.status,
        response.statusText,
        errorData,
        fullUrl
      );
    }

    // Handle empty responses
    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network errors and other fetch failures
    console.error("Request failed:", error);
    throw new ApiError(
      error instanceof Error ? error.message : 'Network request failed',
      0,
      'Network Error',
      null,
      fullUrl
    );
  }
}

// Helper function to prepare request body
function prepareRequestBody(data: any): any {
  if (data instanceof FormData) {
    // Return FormData as-is
    return data;
  } else if (data === null || data === undefined) {
    // Return undefined for null/undefined
    return undefined;
  } else {
    // JSON stringify for regular objects
    return JSON.stringify(data);
  }
}

// Convenience methods
export const api = {
  get: <T = any>(url: string, props?: { params?: Record<string, any> }) => {
    // Auto-include token from localStorage if not provided
    const authToken = (typeof window !== 'undefined' ? AuthService.getAuthStorageData().token : null);
    return simpleRequest<T>(url, { method: "GET", params: props?.params || {}, token: authToken || undefined });
  },

  post: <T = any>(url: string, data?: any, params?: Record<string, any>) => {
    // Auto-include token from localStorage if not provided
    const authToken = (typeof window !== 'undefined' ? AuthService.getAuthStorageData().token : null);
    const body = prepareRequestBody(data);

    return simpleRequest<T>(url, {
      method: "POST",
      body,
      params,
      token: authToken || undefined,
    });
  },

  put: <T = any>(url: string, data?: any, params?: Record<string, any>) => {
    // Auto-include token from localStorage if not provided
    const authToken = (typeof window !== 'undefined' ? AuthService.getAuthStorageData().token : null);
    const body = prepareRequestBody(data);

    return simpleRequest<T>(url, {
      method: "PUT",
      body,
      params,
      token: authToken || undefined,
    });
  },

  patch: <T = any>(url: string, data?: any, params?: Record<string, any>, token?: string) => {
    // Auto-include token from localStorage if not provided
    const authToken = token || (typeof window !== 'undefined' ? AuthService.getAuthStorageData().token : null);
    const body = prepareRequestBody(data);

    return simpleRequest<T>(url, {
      method: "PATCH",
      body,
      params,
      token: authToken || undefined,
    });
  },

  delete: <T = any>(url: string, params?: Record<string, any>, token?: string) => {
    // Auto-include token from localStorage if not provided
    const authToken = token || (typeof window !== 'undefined' ? AuthService.getAuthStorageData().token : null);
    return simpleRequest<T>(url, { method: "DELETE", params, token: authToken || undefined });
  },
};