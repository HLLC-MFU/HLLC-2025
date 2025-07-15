'use client';
import { useState, useEffect } from 'react';

import { apiRequest } from '@/utils/api';
import { ProgressBarActivities } from '@/types/progress';

export default function useProgress() {
  const [progress, setProgress] = useState<ProgressBarActivities | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgressByUser = async () => {
    setProgressLoading(true);
    setError(null);
    try {
      const res = await apiRequest<any>('/activities/progress', 'GET');

      if (res && 'data' in res) {
        setProgress(res.data ?? null);
      } else {
        setProgress(res ?? null);
      }
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message ||
              'Failed to fetch progress by user.'
          : 'Failed to fetch progress by user.',
      );
    } finally {
      setProgressLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressByUser();
  }, []);

  useEffect(() => {}, [progress]);

  return {
    progress,
    progressLoading,
    error,
    fetchProgressByUser,
  };
}
