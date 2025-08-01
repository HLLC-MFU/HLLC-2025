import { getToken } from "./storage";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export interface ApiResponse<T> {
  statusCode: number;
  message: string | null;
  data: T | null;
  remainingCooldownMs?: number;
}

/**
 * General API request function
 * @param endpoint - API route
 * @param method - HTTP method (default: "GET")
 * @param body - Request body for POST/PUT
 * @param options - Additional fetch options
 */
export async function apiRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  body?: object,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = await SecureStore.getItemAsync("accessToken");
     const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

    const headers: HeadersInit = {
      ...(!isFormData && body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { "Authorization": `Bearer ${token.trim()}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body
        ? isFormData
          ? (body as FormData)
          : JSON.stringify(body)
        : undefined,
      ...options,
    });
    const text = await response.text();
    const responseData = text ? JSON.parse(text) : {};

    // ✅ Ensure `statusCode` from API is handled correctly
    if (responseData.statusCode && responseData.message && responseData.data) {
      return { data: responseData.data, statusCode: responseData.statusCode, message: responseData.message || "Request failed" };
    } else if (response.ok) {
      return { data: responseData, statusCode: response.status, message: null };
    }
    
    // Handle cooldown case specifically
    if (responseData.message && responseData.message.toLowerCase().includes('cooldown')) {
      return { 
        data: null, 
        statusCode: response.status, 
        message: responseData.message || "Request failed",
        remainingCooldownMs: responseData.remainingCooldownMs
      };
    }
    
    return { data: null, statusCode: response.status, message: responseData.message || "Request failed" };
  } catch (err) {
    return { data: null, statusCode: 500, message: (err as Error).message };
  }
}
