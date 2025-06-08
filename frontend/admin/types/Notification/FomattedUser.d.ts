export type FormattedUser = {
  avatar?: string;
  id: string;
  name: string;
  studentid?: string;
  major: string;
  majorId: string;
  school: string;
  schoolId: string;
  [key: string]: string | undefined;
};