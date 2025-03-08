import { useState } from "react";
import { apiRequest, ApiResponse } from "@/utils/api";

export function useApi<T>() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  async function request(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
    body?: object,
    options: RequestInit = {}
  ): Promise<T | null> {
    setLoading(true);
    setError(null);

    try {
      // ✅ Ensure `apiRequest` function call correctly includes all parameters
      const response: ApiResponse<T> = await apiRequest<T>(endpoint, method, body, options);

      setData(response.data);
      setError(response.message || null);
      return response.data;
    } catch (error) {
      setError((error as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { data, loading, error, request };
}
