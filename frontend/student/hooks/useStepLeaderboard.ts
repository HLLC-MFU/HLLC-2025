import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/utils/api';
import {
  LeaderboardApiResponse,
  UserRankApiResponse,
  LeaderboardEntry,
} from '../types/stepLeaderboard';

interface LeaderboardState {
  data: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
}

interface UserRankState {
  data: UserRankApiResponse | null;
  loading: boolean;
  error: string | null;
}

const useStepLeaderboard = () => {
  // รวม state ของแต่ละ leaderboard
  const [allLeaderboard, setAllLeaderboard] = useState<LeaderboardState>({
    data: [],
    loading: false,
    error: null,
  });

  const [dailyLeaderboard, setDailyLeaderboard] = useState<LeaderboardState>({
    data: [],
    loading: false,
    error: null,
  });

  const [schoolLeaderboard, setSchoolLeaderboard] = useState<LeaderboardState>({
    data: [],
    loading: false,
    error: null,
  });

  const [schoolDateLeaderboard, setSchoolDateLeaderboard] = useState<LeaderboardState>({
    data: [],
    loading: false,
    error: null,
  });

  const [achievedLeaderboard, setAchievedLeaderboard] = useState<LeaderboardState>({
    data: [],
    loading: false,
    error: null,
  });

  const [userRank, setUserRank] = useState<UserRankState>({
    data: null,
    loading: false,
    error: null,
  });

  // 1. All Leaderboard
  const fetchAllLeaderboard = async () => {
    setAllLeaderboard(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiRequest<LeaderboardApiResponse>(
        '/step-counters/leaderboard/all?limit=20',
        'GET'
      );
      setAllLeaderboard({
        data: response.data?.data || [],
        loading: false,
        error: null,
      });
      return response;
    } catch (err) {
      setAllLeaderboard(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch all leaderboard',
      }));
      throw err;
    }
  };

  // 2. Daily Leaderboard (by date)
  const fetchDailyLeaderboard = async (date: string) => {
    setDailyLeaderboard(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiRequest<LeaderboardApiResponse>(
        `/step-counters/leaderboard/by-date?date=${encodeURIComponent(date)}`,
        'GET'
      );
      setDailyLeaderboard({
        data: response.data?.data || [],
        loading: false,
        error: null,
      });
      return response;
    } catch (err) {
      setDailyLeaderboard(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch daily leaderboard',
      }));
      throw err;
    }
  };

  // 3. School Leaderboard (by schoolId)
  const fetchSchoolLeaderboard = async (schoolId: string) => {
    setSchoolLeaderboard(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiRequest<LeaderboardApiResponse>(
        `/step-counters/leaderboard/by-school?schoolId=${encodeURIComponent(schoolId)}`,
        'GET'
      );
      setSchoolLeaderboard({
        data: response.data?.data || [],
        loading: false,
        error: null,
      });
      return response;
    } catch (err) {
      setSchoolLeaderboard(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch school leaderboard',
      }));
      throw err;
    }
  };

  // 4. School + Date Leaderboard
  const fetchSchoolDateLeaderboard = async (schoolId: string, date: string) => {
    setSchoolDateLeaderboard(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiRequest<LeaderboardApiResponse>(
        `/step-counters/leaderboard/by-school-and-date?schoolId=${encodeURIComponent(schoolId)}&date=${encodeURIComponent(date)}`,
        'GET'
      );
      setSchoolDateLeaderboard({
        data: response.data?.data || [],
        loading: false,
        error: null,
      });
      return response;
    } catch (err) {
      setSchoolDateLeaderboard(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch school+date leaderboard',
      }));
      throw err;
    }
  };

  // 5. Achievement Leaderboard
  const fetchAchievedLeaderboard = async (stepAchievementId?: string) => {
    setAchievedLeaderboard(prev => ({ ...prev, loading: true, error: null }));
    try {
      const url = stepAchievementId
        ? `/step-counters/leaderboard/by-achieved?stepAchievementId=${encodeURIComponent(stepAchievementId)}`
        : '/step-counters/leaderboard/by-achieved';
      const response = await apiRequest<LeaderboardApiResponse>(
        url,
        'GET'
      );
      setAchievedLeaderboard({
        data: response.data?.data || [],
        loading: false,
        error: null,
      });
      return response;
    } catch (err) {
      setAchievedLeaderboard(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch achievement leaderboard',
      }));
      throw err;
    }
  };

  // 6. User Rank
  const fetchUserRank = async (
    userId: string,
    scope: 'global' | 'school' | 'achieved' = 'global',
    stepAchievementId?: string
  ) => {
    setUserRank(prev => ({ ...prev, loading: true, error: null }));
    try {
      let url = `/step-counters/rank/${userId}?scope=${scope}`;
      if (stepAchievementId) {
        url += `&stepAchievementId=${encodeURIComponent(stepAchievementId)}`;
      }
      const response = await apiRequest<UserRankApiResponse>(
        url,
        'GET'
      );
      setUserRank({
        data: response.data || null,
        loading: false,
        error: null,
      });
      return response;
    } catch (err) {
      setUserRank(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch user rank',
      }));
      throw err;
    }
  };

  // Auto-fetch all and achievement leaderboard on mount
  useEffect(() => {
    fetchAllLeaderboard();
    fetchAchievedLeaderboard();
  }, []);

  return {
    // All
    allLeaderboard: allLeaderboard.data,
    allLoading: allLeaderboard.loading,
    allError: allLeaderboard.error,
    fetchAllLeaderboard,
    // Daily
    dailyLeaderboard: dailyLeaderboard.data,
    dailyLoading: dailyLeaderboard.loading,
    dailyError: dailyLeaderboard.error,
    fetchDailyLeaderboard,
    // School
    schoolLeaderboard: schoolLeaderboard.data,
    schoolLoading: schoolLeaderboard.loading,
    schoolError: schoolLeaderboard.error,
    fetchSchoolLeaderboard,
    // School+Date
    schoolDateLeaderboard: schoolDateLeaderboard.data,
    schoolDateLoading: schoolDateLeaderboard.loading,
    schoolDateError: schoolDateLeaderboard.error,
    fetchSchoolDateLeaderboard,
    // Achieved
    achievedLeaderboard: achievedLeaderboard.data,
    achievedLoading: achievedLeaderboard.loading,
    achievedError: achievedLeaderboard.error,
    fetchAchievedLeaderboard,
    // User Rank
    userRank: userRank.data,
    userRankLoading: userRank.loading,
    userRankError: userRank.error,
    fetchUserRank,
  };
};

// Group leaderboard (by schoolId)
export const useGroupStepLeaderboard = (schoolId?: string) => {
  const [state, setState] = useState<LeaderboardState>({
    data: [],
    loading: false,
    error: null,
  });

  const fetchLeaderboard = async () => {
    if (!schoolId) {
      setState({ data: [], loading: false, error: 'No schoolId' });
      return;
    }
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiRequest<LeaderboardApiResponse>(
        `/step-counters/leaderboard/by-school?schoolId=${encodeURIComponent(schoolId)}`,
        'GET'
      );
      setState({
        data: response.data?.data || [],
        loading: false,
        error: null,
      });
      return response;
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch group leaderboard',
      }));
      throw err;
    }
  };

  // fetch on mount or when schoolId changes
  React.useEffect(() => {
    if (schoolId) fetchLeaderboard();
  }, [schoolId]);

  return {
    users: state.data,
    loading: state.loading,
    error: state.error,
    fetchLeaderboard,
  };
};

export default useStepLeaderboard; 