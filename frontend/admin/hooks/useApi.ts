import { useState } from "react";

interface RequestOptions extends RequestInit {
  headers?: HeadersInit;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = async <T, B = unknown>(
    endpoint: string,
    method: string = "GET",
    body?: B,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> => {
    try {
      setLoading(true);
      setError(null);

      const url = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;
      console.log(`Making ${method} request to ${url}`, { body, options });

      // Prepare headers
      const headers: HeadersInit = {};

      // Only set Content-Type for methods that typically have a body
      if (["POST", "PUT", "PATCH"].includes(method) && body) {
        if (body instanceof FormData) {
          // Don't set Content-Type for FormData, browser will set it automatically with boundary
        } else {
          headers["Content-Type"] = "application/json";
        }
      }

      // Merge additional headers from options
      if (options.headers) {
        Object.assign(headers, options.headers);
      }

      // Prepare request options
      const requestOptions: RequestInit = {
        method,
        headers,
        credentials: "include",
        ...options,
      };

      // Add body only if it exists and method allows it
      if (body && !["GET", "DELETE"].includes(method)) {
        requestOptions.body = body instanceof FormData ? body : JSON.stringify(body);
      }

      console.log("Request options:", requestOptions);

      const response = await fetch(url, requestOptions);
      console.log("Response status:", response.status);

      // Handle empty responses (like 204 No Content)
      if (response.status === 204) {
        return { success: true };
      }

      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        const errorMessage = data.message || `HTTP error! status: ${response.status}`;
        console.error("API Error:", {
          status: response.status,
          message: errorMessage,
          data
        });
        throw new Error(errorMessage);
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      console.error("Request error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    request,
    loading,
    error,
  };
};


