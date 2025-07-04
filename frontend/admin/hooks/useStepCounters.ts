import { useEffect, useState } from 'react';
import { addToast } from '@heroui/react';
import { apiRequest } from '@/utils/api';
import { StepsCounters } from '@/types/step-counters';

export function useStepCounters() {
  const [topOverall, setTopOverall] = useState<StepsCounters[]>([]);
  const [topBySchool, setTopBySchool] = useState<StepsCounters[]>([]);
  const [firstAchievers, setFirstAchievers] = useState<StepsCounters[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async (
    scope: 'all' | 'school' | 'date',
    options: {
      schoolId?: string;
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
        ...(options.schoolId ? { schoolId: options.schoolId } : {}),
        ...(options.date ? { date: options.date } : {}),
        ...(options.page ? { page: options.page.toString() } : {}),
        ...(options.pageSize ? { pageSize: options.pageSize.toString() } : {}),
      }).toString();

      const res = await apiRequest<{ data: StepsCounters[] }>(
        `/step-counters/leaderboard?${query}`,
        'GET',
      );

      const data = Array.isArray(res.data?.data) ? res.data.data : [];

      if (scope === 'all') setTopOverall(data);
      if (scope === 'school') setTopBySchool(data);
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

  // preload ทั้ง 3 แบบตอน mount
  useEffect(() => {
    fetchLeaderboard('all', { pageSize: 3 });
    fetchLeaderboard('school');
    fetchLeaderboard('date', { date: new Date().toISOString().split('T')[0] });
  }, []);

  return {
    topOverall,
    topBySchool,
    firstAchievers,
    loading,
    error,
    fetchLeaderboard,
  };
}
