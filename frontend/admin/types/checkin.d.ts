import { Activities } from "./activities";
import { Lang } from "./lang"
import { User} from "./user"

export type Checkin = {
  _id: string;
  user: User;
  staff: User;
  activity: Activities;
  createdAt: string;
  updatedAt: string;
};

export type CheckinCreate = {
  user: string;
  staff?: string;
  activities: string[];
};