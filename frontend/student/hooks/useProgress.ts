import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/utils/api';
import { useProgressStore } from '@/stores/useProgressStore';

type ProgressResponse = {
  userProgressCount: number;
  progressPercentage: number;
  scopedActivitiesCount: number;
  [key: string]: any;
};

export function useProgress() {
  const setProgress = useProgressStore((s) => s.setProgress);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: { data?: ProgressResponse | null; message?: string | null } = await apiRequest('/activities/progress', 'GET');
      if (
        res.data &&
        typeof res.data.userProgressCount === 'number' &&
        typeof res.data.progressPercentage === 'number' &&
        typeof res.data.scopedActivitiesCount === 'number'
      ) {
        setProgress(res.data);
      } else {
        setProgress(null);
        setError(res.message || 'No data');
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch progress');
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }, [setProgress]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return { loading, error, fetchProgress };
}
