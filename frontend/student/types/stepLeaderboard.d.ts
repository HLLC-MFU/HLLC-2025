import { Major } from './major';

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