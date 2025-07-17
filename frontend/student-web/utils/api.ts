'use server';

import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface ApiResponse<T> {
  statusCode: number;
  message: string | null;
  data: T | null;
}

export async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: object | FormData,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    const token = (await cookies()).get('accessToken')?.value;
    const isFormData =
      typeof FormData !== 'undefined' && body instanceof FormData;

    const headers: HeadersInit = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Only set Content-Type for JSON. DO NOT set it for FormData!
      ...(!isFormData && body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      credentials: 'include',
      body: body
        ? isFormData
          ? (body as FormData)
          : JSON.stringify(body)
        : undefined,
      ...options,
    });

    const responseData = await response.json();

    if (responseData.statusCode && responseData.message && responseData.data) {
      return {
        data: responseData.data,
        statusCode: responseData.statusCode,
        message: responseData.message,
      };
    } else if (
      responseData.message &&
      typeof responseData.remainingCooldownMs !== 'undefined' &&
      responseData.message.toLowerCase().includes('cooldown')
    ) {
      // กรณี cooldown error
      return {
        data: { remainingCooldownMs: responseData.remainingCooldownMs } as any,
        statusCode: response.status,
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
      message: responseData.message || 'Request failed',
    };
  } catch (err) {
    return {
      data: null,
      statusCode: 500,
      message: (err as Error).message,
    };
  }
}
