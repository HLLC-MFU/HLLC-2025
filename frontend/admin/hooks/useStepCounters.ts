import { useEffect, useState } from 'react';
import { addToast } from '@heroui/react';
import { apiRequest } from '@/utils/api';
import { StepCounter, StepLeaderboardResponse } from '@/types/step-counters';

export function useStepCounters() {
  const [stepByTop, setStepByTop] = useState<StepCounter[]>([]);
  const [stepBySchool, setStepBySchool] = useState<StepCounter[]>([]);
  const [stepByAcheivement, setStepByAcheivement] = useState<StepCounter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (error: { message?: string }) => {
    addToast({
      title: 'Failed to fetch leaderboard.',
      color: 'danger',
    });
    setError(
      error && typeof error === 'object' && 'message' in error
        ? (error as { message?: string }).message || 'Failed to fetch leaderboard.'
        : 'Failed to fetch leaderboard.'
    );
  };

  const fetchAllLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<StepLeaderboardResponse>("/step-counters/leaderboard", "GET");
      if (res.data) {
        setStepByTop(Array.isArray(res.data.topRank) ? res.data.topRank : []);
        setStepBySchool(Array.isArray(res.data.schoolRank) ? res.data.schoolRank : []);
        setStepByAcheivement(Array.isArray(res.data.achievementRank) ? res.data.achievementRank : []);
      }

      return res;
    } catch (err) {
      handleError(err as { message?: string });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllLeaderboard();
  }, []);

  return {
    stepByTop,
    stepBySchool,
    stepByAcheivement,
    loading,
    error,
    fetchAllLeaderboard,
  };
}
