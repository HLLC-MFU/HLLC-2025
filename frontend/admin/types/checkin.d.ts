import { Lang } from "./lang"

export type Checkin = {
  _id: string;
  user: string;
  staff: string;
  activities: string[];
  createdAt: string;
  updatedAt: string;
};