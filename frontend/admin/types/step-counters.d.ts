import { User as UserType } from "./user";

export type StepsCounters = {
  id: string;
  name: string;
  major: string;
  school: string;
  schoolId: string;
  stepsCounts: number;
  time: string;
  rank?: number;
};


// types/step-achievement.ts
export type StepAchievement = {
  _id: string;
  achievement: number;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
}
