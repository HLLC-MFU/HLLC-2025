import { useEffect, useState } from 'react';
import { Checkin, CheckinCreate } from '@/types/checkin';
import { apiRequest } from '@/utils/api';
import { addToast } from '@heroui/react';

export function useCheckin(activityId: string | null) {
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

      if (res && typeof res === 'object' && 'statusCode' in res && res.statusCode >= 400) {
        throw new Error(res.message || 'Failed to checkin.');
      }

      if (res.data) {
        setCheckin((prev) => [...prev, res.data!]);
      }

      addToast({
        title: 'Successfully checkin.',
        description: 'Checkin successfully.',
        color: 'success',
      });

      return true;
    } catch (err: unknown) {
      let message = 'Failed to checkin.';
      if (err instanceof Error) {
        message = err.message;
      }

      if (message === 'User scope is not allowed by staff role') {
        addToast({
          title: 'Warning',
          description: message,
          color: 'warning',
        });
      } else if (message === 'User already checked in to all activities') {
        addToast({
          title: 'Warning',
          description: message,
          color: 'warning',
        });
      } else {
        addToast({
          title: 'Failed to checkin',
          description: message,
          color: 'danger',
        });
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckinByActivity = async (activityId: string) => {
    setLoading(true);
    try {
      const res = await apiRequest<Checkin[]>(`/checkins/users?activityId=${activityId}`, 'GET');
      const data = res.data || [];
      setCheckin(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activityId) {
      fetchCheckinByActivity(activityId);
    }
  }, [activityId]);

  return {
    checkin,
    loading,
    error,
    createCheckin,
    fetchCheckinByActivity,
  };
}
