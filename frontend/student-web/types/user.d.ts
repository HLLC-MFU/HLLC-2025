import { Major } from "./major";

export interface CheckedUser {
  username: string;
  name: {
    first: string;
    middle?: string;
    last: string;
  };
  metadata?: {
    major?: {
      name?: { en: string; th: string };
      school?: { name?: { en: string; th: string } };
    };
  };
}


interface Province {
  name_th: string;
  name_en: string;
}
