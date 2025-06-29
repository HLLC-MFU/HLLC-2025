import { useState, useEffect } from 'react';
import { apiRequest } from '@/utils/api';
import { UserRankApiResponse } from '../types/stepLeaderboard';
import useProfile from './useProfile';

interface UserRankState {
  data: UserRankApiResponse | null;
  loading: boolean;
  error: string | null;
}

const useUserRank = (
  scope: 'global' | 'school' | 'achieved' = 'global',
  stepAchievementId?: string
) => {
  const { user } = useProfile();
  const [state, setState] = useState<UserRankState>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchUserRank = async () => {
    if (!user?.data?.[0]?._id) {
      setState({ data: null, loading: false, error: 'No user ID available' });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      let url = `/step-counters/rank/${user.data[0]._id}?scope=${scope}`;
      if (stepAchievementId) {
        url += `&stepAchievementId=${encodeURIComponent(stepAchievementId)}`;
      }
      const response = await apiRequest<UserRankApiResponse>(
        url,
        'GET'
      );
      setState({
        data: response.data || null,
        loading: false,
        error: null,
      });
      return response;
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch user rank',
      }));
      throw err;
    }
  };

  // Auto-fetch when component mounts or when scope/stepAchievementId changes
  useEffect(() => {
    if (user?.data?.[0]?._id) {
      fetchUserRank();
    }
  }, [user?.data?.[0]?._id, scope, stepAchievementId]);

  return {
    userRank: state.data,
    loading: state.loading,
    error: state.error,
    fetchUserRank,
  };
};

export default useUserRank; 