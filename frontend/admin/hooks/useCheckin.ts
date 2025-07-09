import { useState, useEffect } from 'react';
import { Checkin, CheckinCreate } from '@/types/checkin';
import { addToast } from '@heroui/react';
import { apiRequest } from '@/utils/api';

export function useCheckin() {
  const [checkin, setCheckin] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createcheckin = async (checkinData: Partial<CheckinCreate>) => {
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
        addToast({
          title: 'School created successfully!',
          color: 'success',
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create school.');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    checkin,
    loading,
    error,
    createcheckin,
  };
}
