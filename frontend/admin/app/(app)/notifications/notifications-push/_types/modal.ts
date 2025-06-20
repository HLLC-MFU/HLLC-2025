
// Main Format Data

export type InformationInfoData = {
  icon?: React.ElementType;
  title: { en: string; th: string };
  subtitle: { en: string; th: string };
  body: { en: string; th: string };
  redirect: { en: string; th: string; link: string };
  imageUrl?: string;
  imageFile?: File;
};

// Scope

export type SelectionScope = {
    type: 'major' | 'school' | 'individual';
    id: string[];
};

// Language

export const language = [
  { key: 'en', label: 'EN' },
  { key: 'th', label: 'TH' },
];

// Student Table

export const columns = [
  { name: 'NAME', uid: 'name', sortable: true },
  { name: 'MAJOR', uid: 'major', sortable: true },
];

// Main Format Data In Table

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

export const INITIAL_VISIBLE_COLUMNS = ['name', 'major'];

