import { Major } from "./major";
import { User } from "./user";

export type StepCounter = {
  _id: string;
  user: User;
  achievement: StepAchievement;
  deviceId: string;
  completeStatus: boolean;
  steps: Steps[];
  createdAt: string;
  updatedAt: string;
  totalStep: number;
  rank?: number;
  computedRank?: number;
};

export type StepAchievement = {
  _id: string;
  achievement: number;
  createdAt: string;
  updatedAt: string;
};

export type Steps = {
  _id: string;
  step: number;
  totalStep: number;
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type StepLeaderboardResponse = {
  topRank: StepCounter[];
  schoolRank: StepCounter[];
  achievementRank: StepCounter[];
};
