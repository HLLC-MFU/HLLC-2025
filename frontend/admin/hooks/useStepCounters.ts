import { useEffect, useState } from 'react';
import { addToast } from '@heroui/react';
import { apiRequest } from '@/utils/api';
import { StepCounter } from '@/types/step-counters';

export function useStepCounters() {
  const [stepByAll, setStepByAll] = useState<StepCounter[]>([]);
  const [stepBySchool, setStepBySchool] = useState<StepCounter[]>([]);
  const [stepByDate, setStepByDate] = useState<StepCounter[]>([]);
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
      const resAll = await apiRequest<{ data: StepCounter[] }>("/step-counters/leaderboard?scope=all", "GET");
      if (!resAll.data) return;
      setStepByAll(Array.isArray(resAll.data.data) ? resAll.data.data : []);

      return resAll;
    } catch (err) {
      handleError(err as { message?: string });
    } finally {
      setLoading(false);
    }
  };

  const fetchSchoolLeaderboard = async (schoolId: string) => {
    setLoading(true);
    setError(null);
    try {
      const resSchool = await apiRequest<{ data: StepCounter }>(`/step-counters/leaderboard?scope=school&schoolId=${schoolId}`, "GET");
      if (!resSchool.data) return;

      setStepBySchool(Array.isArray(resSchool.data.data) ? resSchool.data.data : []);

      return resSchool.data.data;
    } catch (err) {
      handleError(err as { message?: string });
    } finally {
      setLoading(false);
    }
  };

  const fetchDateLeaderboard = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const resDate = await apiRequest<{ data: StepCounter[] }>(`/step-counters/leaderboard?scope=date&date=${date}`, "GET");
      if (!resDate.data) return;

      setStepByDate(Array.isArray(resDate.data.data) ? resDate.data.data : []);

      return resDate;
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
    stepByAll,
    stepBySchool,
    stepByDate,
    loading,
    error,
    fetchAllLeaderboard,
    fetchSchoolLeaderboard,
    fetchDateLeaderboard,
  };
}
