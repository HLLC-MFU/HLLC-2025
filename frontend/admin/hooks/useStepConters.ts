import { useEffect, useState } from 'react';
import { addToast } from '@heroui/react';

import { apiRequest } from '@/utils/api';
import { StepsConters } from '@/types/step-conters';

export function useStepConters() {
  const [stepCounters, setStepCounters] = useState<StepsConters[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<String | null>(null);

  const fetchStepConters = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ data: StepsConters[] }>(
        '/step-counters',
        'GET',
      );

      setStepCounters(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      addToast({
        title: 'Failed to fetch StepsConters Data',
        color: 'danger',
      });
      setError(
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message ||
              'Failed to fetch StepsConters type.'
          : 'Failed to fetch StepsConters type.',
      );
    }finally{
      setLoading(false)
    }
  };

  useEffect(() => {
    fetchStepConters();
  }, [])

  return{
    stepCounters,
    loading,
    error,
    fetchStepConters
  }
}
