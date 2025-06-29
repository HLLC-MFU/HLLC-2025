import { Major } from './major';

// User object as returned in leaderboard (populated)
export interface LeaderboardUser {
  _id: string;
  username?: string;
  name: {
    first: string;
    middle?: string;
    last?: string;
  };
  role?: {
    name: string;
  };
  metadata?: {
    major: Major;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Generic leaderboard entry (with rank, totalStep, etc.)
export interface LeaderboardEntry {
  user: LeaderboardUser;
  totalStep: number;
  rank?: number;
  achievedDate?: string; // for achievement leaderboard
  completionDate?: string; // for achievement leaderboard (optional)
}

// Response for /leaderboard/all, /by-date, /by-school, /by-school-and-date, /achieved
export interface LeaderboardApiResponse {
  data: LeaderboardEntry[];
  metadata: {
    total: number;
    date?: string;
    schoolId?: string;
  };
  message: string;
}

// Response for /rank/:userId
export interface UserRankApiResponse {
  rank: number;
  total: number;
  stepCount: number;
  username: string | null;
  name: {
    first: string;
    middle?: string;
    last?: string;
  };
  message: string;
}

export type StepLeaderboardUser = {
  name: {
    first: string;
    middle?: string;
    last?: string;
  };
  stepCount: number;
};

export interface StepCounterUserRaw {
  user: {
    name: {
      first: string;
      middle?: string;
      last?: string;
    };
  } | null;
  stepCount: number;
}

export interface StepCounterApiResponse {
  data: StepCounterUserRaw[];
  meta?: unknown;
  message?: string;
}

export interface GroupLeaderboardUser {
  _id: string;
  username: string;
  user: {
    name: {
      first: string;
      middle?: string;
      last: string;
    };
  };
  role: {
    name: string;
  };
  metadata: {
    major: Major;
  };
  createdAt: string;
  updatedAt: string;
  stepCount: number;
}

export interface GroupStepLeaderboardApiResponse {
  data: GroupLeaderboardUser[];
  meta?: unknown;
  message?: string;
} 