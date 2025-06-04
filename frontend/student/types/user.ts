export interface UserData {
  _id: string;
  username: string;
  name: {
    first: string;
    last: string;
  };
  role: {
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface User {
  data: UserData[];
  message: string;
} 