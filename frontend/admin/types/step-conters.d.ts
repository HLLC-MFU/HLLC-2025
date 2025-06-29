import { User as UserType } from "./user";

export type StepsConters = {
  _id: string;
  user: UserType
  stepCount: number;
};