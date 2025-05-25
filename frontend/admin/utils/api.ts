"use server";
import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface ApiResponse<T> {
  statusCode: number;
  message: string | null;
  data: T | null;
}

export async function apiRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  body?: object,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = (await cookies()).get('accessToken')?.value;

    const headers: HeadersInit = {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });

    const responseData = await response.json();

    if (responseData.statusCode && responseData.message && responseData.data) {
      return {
        data: responseData.data,
        statusCode: responseData.statusCode,
        message: responseData.message,
      };
    } else if (response.ok) {
      return {
        data: responseData,
        statusCode: response.status,
        message: null,
      };
    }

    return {
      data: null,
      statusCode: response.status,
      message: responseData.message || "Request failed",
    };
  } catch (err) {
    return {
      data: null,
      statusCode: 500,
      message: (err as Error).message,
    };
  }
}
