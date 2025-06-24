import { useState, useEffect } from 'react';
import { apiRequest } from '@/utils/api';
import {
  StepLeaderboardUser,
  StepCounterUserRaw,
  StepCounterApiResponse,
  GroupLeaderboardUser,
  GroupStepLeaderboardApiResponse,
} from '../types/stepLeaderboard';

const useStepLeaderboard = () => {
  const [users, setUsers] = useState<StepLeaderboardUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<StepCounterApiResponse>('/step-counters?sort=-stepCount&limit=5', 'GET');
      if (response.data) {
        setUsers(
          (response.data.data || []).map((item: StepCounterUserRaw) => ({
            name: item.user?.name || { first: 'Unknown' },
            stepCount: item.stepCount,
          }))
        );
      }
      return response;
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err as { message?: string }).message || 'Failed to fetch leaderboard.'
        : 'Failed to fetch leaderboard.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return {
    users,
    loading,
    error,
    fetchLeaderboard,
  };
};

const useGroupStepLeaderboard = (schoolId?: string) => {
  const [users, setUsers] = useState<GroupLeaderboardUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    console.log('[GroupLeaderboard] schoolId:', schoolId);
    if (!schoolId) {
      setUsers([]);
      setError('No schoolId');
      console.log('[GroupLeaderboard] No schoolId');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<GroupStepLeaderboardApiResponse>(`/step-counters/${schoolId}/schools`, 'GET');
      console.log('[GroupLeaderboard] API response:', response);
      console.log('[GroupLeaderboard] response.data:', response.data);
      console.log('[GroupLeaderboard] response.data.data:', response.data?.data);
      if (response.data && Array.isArray(response.data.data)) {
        setUsers(
          response.data.data
            .filter((item: GroupLeaderboardUser) => item.stepCount > 0)
            .sort((a: GroupLeaderboardUser, b: GroupLeaderboardUser) => b.stepCount - a.stepCount)
        );
      } else {
        setUsers([]);
      }
      return response;
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err as { message?: string }).message || 'Failed to fetch group leaderboard.'
        : 'Failed to fetch group leaderboard.';
      setError(errorMessage);
      console.log('[GroupLeaderboard] Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId) fetchLeaderboard();
  }, [schoolId]);

  return {
    users,
    loading,
    error,
    fetchLeaderboard,
  };
};

export {
  useStepLeaderboard,
  useGroupStepLeaderboard,
}; 