type CheckedUser = {
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

type Province = {
  name_th: string;
  name_en: string;
}

export type User = {
  _id: string;
  name: {
    first: string;
    middle?: string;
    last?: string;
  };
  username: string;
  role: Role;
  metadata?: Metadata[];
};

export type UserName = {
  first: string;
  middle?: string;
  last: string;
};

export type Metadata = {
  major: {
    _id: string;
    name: Lang;
    school: School;
  };
}
