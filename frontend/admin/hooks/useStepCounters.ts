import { useEffect, useState } from 'react';
import { addToast } from '@heroui/react';
import { apiRequest } from '@/utils/api';
import { StepCounter } from '@/types/step-counters';

export function useStepCounters() {
  const [all, setAll] = useState<StepCounter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      let page = 1;
      const pageSize = 20;
      let combined: StepCounter[] = [];
      let hasMore = true;

      while (hasMore) {
        const query = new URLSearchParams({
          scope: 'all',
          page: page.toString(),
          pageSize: pageSize.toString(),
        }).toString();

        const res = await apiRequest<{ data: StepCounter[] }>(
          `/step-counters/leaderboard?${query}`,
          'GET'
        );

        const data = Array.isArray(res.data?.data) ? res.data.data : [];

        combined = [...combined, ...data];
        hasMore = data.length === pageSize; 
        page++;
      }

      setAll(combined);
    } catch (err) {
      addToast({
        title: 'Failed to fetch full leaderboard.',
        color: 'danger',
      });
      setError(
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message || 'Failed to fetch leaderboard.'
          : 'Failed to fetch leaderboard.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllLeaderboard();
  }, []);

  return {
    all,
    loading,
    error,
    refetch: fetchAllLeaderboard,
  };
}
