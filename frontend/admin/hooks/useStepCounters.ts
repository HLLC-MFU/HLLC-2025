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

  const fetchTopOverall = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ data: StepsCounters[] }>(
        '/step-counters/leaderboard/all?limit=3',
        'GET',
      );
      setTopOverall(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      addToast({
        title: 'Failed to fetch Top Overall data.',
        color: 'danger',
      });
      setError(
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message || 'Failed to fetch Top Overall data.'
          : 'Failed to fetch Top Overall data.',
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchTopBySchool = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ data: StepsCounters[] }>(
        '/step-counters/leaderboard/by-top-per-school',
        'GET',
      );
      setTopBySchool(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      addToast({
        title: 'Failed to fetch Top by School data.',
        color: 'danger',
      });
      setError(
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message || 'Failed to fetch Top by School data.'
          : 'Failed to fetch Top by School data.',
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchFirstAchievers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ data: StepsCounters[] }>(
        '/step-counters/leaderboard/by-achieved',
        'GET',
      );
      setFirstAchievers(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      addToast({
        title: 'Failed to fetch First Achievers data.',
        color: 'danger',
      });
      setError(
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message || 'Failed to fetch First Achievers data.'
          : 'Failed to fetch First Achievers data.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopOverall();
    fetchTopBySchool();
    fetchFirstAchievers();
  }, []);

  return {
    topOverall,
    topBySchool,
    firstAchievers,
    loading,
    error,
    fetchTopOverall,
    fetchTopBySchool,
    fetchFirstAchievers,
  };
}
