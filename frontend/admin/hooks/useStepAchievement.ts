import { useState, useEffect } from 'react';
import { StepAchievement } from '@/types/step-counters';
import { apiRequest } from '@/utils/api';
import { addToast } from '@heroui/react';

export function useStepAchievement() {
  const [achievement, setAchievement] = useState<StepAchievement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievement = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ data: StepAchievement[] }>(
        '/step-achievement',
        'GET'
      );
      if (!res.data?.data) return;
      setAchievement(res.data.data[0])

      return res;
    } catch (err) {
      setError(`Fetch failed: ${err}`);
      addToast({
        title: 'Fetch failed',
        description: 'Failed to fetch step achievement',
        color: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAchievement = async (steps: number) => {
    if (!achievement || !steps) return;

    try {
      const res = await apiRequest<StepAchievement>(
        `/step-achievement/${achievement._id}`,
        'PATCH',
        { achievement: steps }
      );
      if (!res) return;

      setAchievement(res.data);
      addToast({
        title: 'Update successfully',
        description: 'Success to update step achievement',
        color: 'success'
      });

      return res;
    } catch (err) {
      setError(`Fetch failed: ${err}`);
      addToast({
        title: 'Update failed',
        description: 'Failed to update step achievement',
        color: 'danger'
      });
    }
  };

  useEffect(() => {
    fetchAchievement();
  }, []);

  return {
    achievement,
    loading,
    error,
    fetchAchievement,
    updateAchievement,
  };
}
