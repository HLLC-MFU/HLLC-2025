import { useEffect, useState } from 'react';
import { apiRequest } from '@/utils/api';

interface ProgressResponse {
  userProgressCount: number;
  progressPercentage: number;
  scopedActivitiesCount: number;
}

export function useProgress() {
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiRequest<ProgressResponse>('/activities/progress', 'GET');
        if (res.data) {
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
    };
    fetchProgress();
  }, []);

  return { progress, loading, error };
} 