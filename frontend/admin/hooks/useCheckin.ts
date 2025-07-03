import { useState, useEffect } from 'react';
import { Checkin, CheckinCreate, CheckinStats } from '@/types/checkin';
import { addToast } from '@heroui/react';
import { apiRequest } from '@/utils/api';

export function useCheckin() {
  const [checkin, setCheckin] = useState<Checkin[]>([]);
  const [checkinStats, setCheckinStats] = useState<CheckinStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCheckin = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<{ data: Checkin[] }>( '/checkins', 'GET');
      setCheckin(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (err) {
      addToast({
        title: 'Failed to fetch checkins',
        color: 'danger',
      });
      setError(
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message || 'Failed to fetch checkins.'
          : 'Failed to fetch checkins.',
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckinStats = async () => {
    setLoading(true)
    setError(null)
    try {
        const response = await apiRequest<{ data: CheckinStats[] }>( '/checkins/statistics', 'GET');
        setCheckinStats(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      addToast({
        title: 'Failed to fetch checkin statistics',
        color: 'danger',
      })
      setError(
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message || 'Failed to fetch checkin statistics.'
          : 'Failed to fetch checkin statistics.',
      );
    } finally {
      setLoading(false);
    }
  };

  const createCheckin = async (checkinData: Partial<CheckinCreate>) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        user: checkinData.user,
        activities: checkinData.activities,
      };

      const response = await apiRequest( '/checkins', 'POST', payload,)

      if (response.statusCode === 201) {
        setCheckin((prev) => [...prev, response.data as Checkin]);
        addToast({
          title: 'Check-in successful',
          description: 'User has been checked in successfully',
          color: 'success',
        });
      } else {
        throw new Error(response.message || 'Failed to create check-in');
      }
    } catch (err: any) {
      addToast({
        title: 'Check-in failed',
        description: err.message || 'Failed to create check-in',
        color: 'danger',
      });
      setError(err.message || 'Failed to create checkin.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckin();
    fetchCheckinStats();
  }, []);

  return {
    checkin,
    checkinStats,
    loading,
    error,
    fetchCheckin,
    fetchCheckinStats,
    createCheckin,
  };
}
