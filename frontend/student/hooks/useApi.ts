import { apiRequest } from '@/lib/api/api';
import { useState } from 'react';

export function useApi<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  async function request(endpoint: string, options: RequestInit = {}) {
    setLoading(true);
    setError(null);
    try {
      const result = await apiRequest<T>(endpoint, options);
      setData(result);
      return result;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { data, loading, error, request };
}
