import { Lang } from "./lang"

export type Checkin = {
  status: string;
  _id: string;
  user: User;
  staff: string;
  activity: Activity;
  createdAt: string;
  updatedAt: string;
};

export type Activity = {
  _id: string;
  name: Lang;
  fullDetails: Lang;
  shortDetails: Lang;
  type: string;
  photo: {
    thumb: string;
    full: string;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
};


export type User = {
  _id: string;
  name: Name;
  username: string;
  metadata: {
    major: string;
  }
}

export type Name = {
  first: string;
  middle?: string;
  last: string;
};

export type CheckinCreate = {
  user: string;
  staff?: string;
  activities: string[];
};