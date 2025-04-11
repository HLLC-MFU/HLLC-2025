import { useState } from "react";
import { ApiResponse } from "@/utils/api";
import { getToken } from "@/utils/storage";

export function useApi<T>() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const request = async (
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
    body?: object,
    options: RequestInit = {}
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken("accessToken");

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      };

      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        ...options,
      });

      const response: ApiResponse<T> = await res.json();

      setData(response.data ?? null);
      setError(response.message || null);
      return response.data ?? null;
    } catch (error) {
      setError((error as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    request,
  };
}
