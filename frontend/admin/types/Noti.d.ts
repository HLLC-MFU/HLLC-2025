import { Lang } from './lang'

export type Student = {
  id: string;
  name: UserName;
  username: string;
  metadata: {
    major: string;
  };
};

export type UserName = {
    first: string;
    middle?: string;
    last: string;
}