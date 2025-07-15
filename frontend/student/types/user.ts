import { Major } from "./major";

export interface UserData {
  _id: string;
  username: string;
  name: {
    first: string;
    middle?: string;
    last?: string;
  };
  role: {
    name: string;
  };
  metadata: {
    major: Major;
  }
  createdAt: string;
  updatedAt: string;
}

export interface User {
  data: UserData[];
  message: string;
} 

export interface Name {
  first: string;
  middle?: string;
  last?: string;
}
