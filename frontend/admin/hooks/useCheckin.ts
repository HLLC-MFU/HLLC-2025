import { useState } from 'react';
import { Checkin, CheckinCreate } from '@/types/checkin';
import { apiRequest } from '@/utils/api';
import { addToast } from '@heroui/react';

export function useCheckin() {
  const [checkin, setCheckin] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckin = async (checkinData: Partial<CheckinCreate>) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        staff: checkinData.staff,
        user: checkinData.user,
        activities: checkinData.activities,
      };

      const res = await apiRequest<Checkin>(`/checkins`, 'POST', payload);

      if (res.data) {
        if (res.data) {
          if (res.data) {
            setCheckin((prev) => (res.data ? [...prev, res.data] : prev));
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        throw err;
      } else {
        setError('Failed to checkin.');
        throw new Error('Failed to checkin.');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    checkin,
    loading,
    error,
    createCheckin,
  };
}
