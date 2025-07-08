import { Major } from "./major";

export type StepEntry = {
  _id: string;
  step: number;
  totalStep: number;
  date: string;         
  createdAt: string;
  updatedAt: string;
};

export type UserInfo = {
  _id: string;
  name: {
    first: string;
    middle: string;
    last: string;
  };
  username: string;
  role: string;
  metadata: {
    major: Major;
  };
  createdAt: string;
  updatedAt: string;
};

export type StepCounter = {
  _id: string;
  user: UserInfo;
  achievement: string;
  deviceId: string;
  completeStatus: boolean;
  steps: StepEntry[];
  createdAt: string;
  updatedAt: string;
  rank?: number;
  totalStep: number;
};

export type StepCountersResponse = {
  data: StepCounter[];
  metadata: {
    total: number;
    page: number;
    pageSize: number;
    scope: string;
    date: string | null;
  };
};

export type StepContersTableProps = {
  stepCounters: StepCounter[];
};

export type StepAchievement = {
  _id: string;
  achievement: number;
  createdAt: string;
  updatedAt: string;
};

export type StepAchievementResponse = {
  data: StepAchievement[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    lastUpdatedAt: string;
  };
  message: string;
};
