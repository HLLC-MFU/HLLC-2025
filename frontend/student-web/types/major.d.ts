export type Lang = {
  en: string;
  th?: string;
};

export type School = {
  _id: string;
  name: Lang;
  acronym?: string;
  detail?: Lang;
};

export type Major = {
  _id: string;
  name: Lang;
  acronym?: string;
  detail?: Lang;
  school: School;
};