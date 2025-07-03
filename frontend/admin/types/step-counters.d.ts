import { User as UserType } from "./user";

export type StepsCounters = {
  _id: string;
  user: UserType
  stepCount: number;
};