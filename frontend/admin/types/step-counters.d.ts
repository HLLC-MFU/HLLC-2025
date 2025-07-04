import { User as UserType } from "./user";

export type StepsCounters = {
  key: string; // จาก _id
  name: string;
  major: string;
  school: string;
  stepsCounts: number;
  time: string; // วันที่ (จาก steps[0]?.date)
  rank?: number;
};