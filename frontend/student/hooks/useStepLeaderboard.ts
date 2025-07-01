import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/utils/api';
import {
  LeaderboardApiResponse,
  UserRankApiResponse,
  LeaderboardEntry,
} from '../types/stepLeaderboard';
import useProfile from './useProfile';

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

type UserRankScope = 'global' | 'school' | 'achieved';
type LeaderboardType = 'all' | 'daily' | 'school' | 'schoolDate' | 'achieved';
type UserRankAllState = Record<UserRankScope, UserRankState>;
type LeaderboardsState = Record<LeaderboardType, LeaderboardState>;

const initialUserRankState: UserRankState = { data: null, loading: false, error: null };
const initialLeaderboardState: LeaderboardState = { data: [], loading: false, error: null };

const useStepLeaderboard = () => {
  const [leaderboards, setLeaderboards] = useState<LeaderboardsState>({
    all: { ...initialLeaderboardState },
    daily: { ...initialLeaderboardState },
    school: { ...initialLeaderboardState },
    schoolDate: { ...initialLeaderboardState },
    achieved: { ...initialLeaderboardState },
  });

  const [userRank, setUserRank] = useState<UserRankAllState>({
    global: { ...initialUserRankState },
    school: { ...initialUserRankState },
    achieved: { ...initialUserRankState },
  });

  const [lastAchievementId, setLastAchievementId] = useState<string>();
  const { user } = useProfile();
  const userId = user?.data?.[0]?._id;

  const updateLeaderboard = useCallback((type: LeaderboardType, updates: Partial<LeaderboardState>) => {
    setLeaderboards(prev => ({ ...prev, [type]: { ...prev[type], ...updates } }));
  }, []);

  const updateUserRank = useCallback((scope: UserRankScope, updates: Partial<UserRankState>) => {
    setUserRank(prev => ({ ...prev, [scope]: { ...prev[scope], ...updates } }));
  }, []);

  const fetchAllLeaderboard = useCallback(async () => {
    updateLeaderboard('all', { loading: true, error: null });
    try {
      const response = await apiRequest<LeaderboardApiResponse>('/step-counters/leaderboard/all?limit=20', 'GET');
      updateLeaderboard('all', { data: response.data?.data || [], loading: false, error: null });
      return response;
    } catch (err) {
      updateLeaderboard('all', { loading: false, error: 'Failed to fetch all leaderboard' });
      throw err;
    }
  }, [updateLeaderboard]);

  const fetchDailyLeaderboard = useCallback(async (date: string) => {
    updateLeaderboard('daily', { loading: true, error: null });
    try {
      const response = await apiRequest<LeaderboardApiResponse>(
        `/step-counters/leaderboard/by-date?date=${encodeURIComponent(date)}`, 'GET'
      );
      updateLeaderboard('daily', { data: response.data?.data || [], loading: false, error: null });
      return response;
    } catch (err) {
      updateLeaderboard('daily', { loading: false, error: 'Failed to fetch daily leaderboard' });
      throw err;
    }
  }, [updateLeaderboard]);

  const fetchSchoolLeaderboard = useCallback(async (schoolId: string) => {
    updateLeaderboard('school', { loading: true, error: null });
    try {
      const response = await apiRequest<LeaderboardApiResponse>(
        `/step-counters/leaderboard/by-school?schoolId=${encodeURIComponent(schoolId)}`, 'GET'
      );
      updateLeaderboard('school', { data: response.data?.data || [], loading: false, error: null });
      return response;
    } catch (err) {
      updateLeaderboard('school', { loading: false, error: 'Failed to fetch school leaderboard' });
      throw err;
    }
  }, [updateLeaderboard]);

  const fetchSchoolDateLeaderboard = useCallback(async (schoolId: string, date: string) => {
    updateLeaderboard('schoolDate', { loading: true, error: null });
    try {
      const response = await apiRequest<LeaderboardApiResponse>(
        `/step-counters/leaderboard/by-school-and-date?schoolId=${encodeURIComponent(schoolId)}&date=${encodeURIComponent(date)}`, 'GET'
      );
      updateLeaderboard('schoolDate', { data: response.data?.data || [], loading: false, error: null });
      return response;
    } catch (err) {
      updateLeaderboard('schoolDate', { loading: false, error: 'Failed to fetch school+date leaderboard' });
      throw err;
    }
  }, [updateLeaderboard]);

  const fetchAchievedLeaderboard = useCallback(async (stepAchievementId?: string) => {
    updateLeaderboard('achieved', { loading: true, error: null });
    try {
      const url = stepAchievementId
        ? `/step-counters/leaderboard/by-achieved?stepAchievementId=${encodeURIComponent(stepAchievementId)}`
        : '/step-counters/leaderboard/by-achieved';
      const response = await apiRequest<LeaderboardApiResponse>(url, 'GET');
      updateLeaderboard('achieved', { data: response.data?.data || [], loading: false, error: null });
      return response;
    } catch (err) {
      updateLeaderboard('achieved', { loading: false, error: 'Failed to fetch achievement leaderboard' });
      throw err;
    }
  }, [updateLeaderboard]);

  const fetchUserRank = useCallback(async (scope: UserRankScope, stepAchievementId?: string) => {
    updateUserRank(scope, { loading: true, error: null });
    try {
      let url = `/step-counters/my-rank?scope=${scope}`;
      if (stepAchievementId) url += `&stepAchievementId=${encodeURIComponent(stepAchievementId)}`;
      const response = await apiRequest<UserRankApiResponse>(url, 'GET');
      updateUserRank(scope, { data: response.data || null, loading: false, error: null });
      return response;
    } catch (err) {
      updateUserRank(scope, { loading: false, error: 'Failed to fetch user rank' });
      throw err;
    }
  }, [updateUserRank]);

  // Auto-fetch
  useEffect(() => {
    fetchAllLeaderboard();
    fetchAchievedLeaderboard();
  }, [fetchAllLeaderboard, fetchAchievedLeaderboard]);

  useEffect(() => {
    if (userId) {
      fetchUserRank('global');
      fetchUserRank('school');
    }
  }, [userId, fetchUserRank]);

  useEffect(() => {
    if (userId && lastAchievementId) {
      fetchUserRank('achieved', lastAchievementId);
    }
  }, [userId, lastAchievementId, fetchUserRank]);

  return {
    // All
    allLeaderboard: leaderboards.all.data,
    allLoading: leaderboards.all.loading,
    allError: leaderboards.all.error,
    fetchAllLeaderboard,
    // Daily
    dailyLeaderboard: leaderboards.daily.data,
    dailyLoading: leaderboards.daily.loading,
    dailyError: leaderboards.daily.error,
    fetchDailyLeaderboard,
    // School
    schoolLeaderboard: leaderboards.school.data,
    schoolLoading: leaderboards.school.loading,
    schoolError: leaderboards.school.error,
    fetchSchoolLeaderboard,
    // School+Date
    schoolDateLeaderboard: leaderboards.schoolDate.data,
    schoolDateLoading: leaderboards.schoolDate.loading,
    schoolDateError: leaderboards.schoolDate.error,
    fetchSchoolDateLeaderboard,
    // Achieved
    achievedLeaderboard: leaderboards.achieved.data,
    achievedLoading: leaderboards.achieved.loading,
    achievedError: leaderboards.achieved.error,
    fetchAchievedLeaderboard,
    // User Rank
    individualUserRank: userRank.global.data,
    schoolUserRank: userRank.school.data,
    achievementUserRank: userRank.achieved.data,
    userRankLoading: userRank.global.loading || userRank.school.loading || userRank.achieved.loading,
    userRankError: userRank.global.error || userRank.school.error || userRank.achieved.error,
    fetchUserRank,
    setLastAchievementId,
  };
};

export const useGroupStepLeaderboard = (schoolId?: string) => {
  const [state, setState] = useState<LeaderboardState>(initialLeaderboardState);

  const fetchLeaderboard = useCallback(async () => {
    if (!schoolId) {
      setState({ data: [], loading: false, error: 'No schoolId' });
      return;
    }
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiRequest<LeaderboardApiResponse>(
        `/step-counters/leaderboard/by-school?schoolId=${encodeURIComponent(schoolId)}`, 'GET'
      );
      setState({ data: response.data?.data || [], loading: false, error: null });
      return response;
    } catch (err) {
      setState(prev => ({ ...prev, loading: false, error: 'Failed to fetch group leaderboard' }));
      throw err;
    }
  }, [schoolId]);

  useEffect(() => {
    if (schoolId) fetchLeaderboard();
  }, [schoolId, fetchLeaderboard]);

  return {
    users: state.data,
    loading: state.loading,
    error: state.error,
    fetchLeaderboard,
  };
};

export default useStepLeaderboard;