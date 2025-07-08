import { useEffect, useState } from 'react';
import { addToast } from '@heroui/react';
import { apiRequest } from '@/utils/api';
import { StepsCountersList } from '@/types/step-counters';

export function useStepCounters() {
  const [topOverall, setTopOverall] = useState<StepsCountersList[]>([]);
  const [firstAchievers, setFirstAchievers] = useState<StepsCountersList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async (
    scope: 'all' | 'date', // ⬅️ ลบ 'school'
    options: {
      date?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        scope,
        ...(options.date ? { date: options.date } : {}),
        ...(options.page ? { page: options.page.toString() } : {}),
        ...(options.pageSize ? { pageSize: options.pageSize.toString() } : {}),
      }).toString();

      const res = await apiRequest<{ data: StepsCountersList[] }>(
        `/step-counters/leaderboard?${query}`,
        'GET',
      );

      const data = Array.isArray(res.data?.data) ? res.data.data : [];

      if (scope === 'all') setTopOverall(data);
      if (scope === 'date') setFirstAchievers(data);
    } catch (err) {
      addToast({
        title: 'Failed to fetch leaderboard.',
        color: 'danger',
      });
      setError(
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message || 'Failed to fetch leaderboard.'
          : 'Failed to fetch leaderboard.',
      );
    } finally {
      setLoading(false);
    }
  };

  // preload แค่ top overall + first achievers
  useEffect(() => {
    fetchLeaderboard('all', { pageSize: 3 });
    fetchLeaderboard('date', { date: new Date().toISOString().split('T')[0] });
  }, []);

  return {
    topOverall,
    firstAchievers,
    loading,
    error,
    fetchLeaderboard,
  };
}
