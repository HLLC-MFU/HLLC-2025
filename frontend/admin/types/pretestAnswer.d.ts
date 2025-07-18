import { PrepostQuestions } from './prepostQuestion'
import { Lang } from './lang';

export type PretestAnswer = {
    _id: string;
    user: User
    answers: Answers[];
};

type Answers = {
    pretest: PrepostQuestions;
    answer: string;
};

export type PretestAverage = {
    pretest: PrepostQuestions;
    average: number;
    count: number;
};

export type User = {
    _id: string;
    name: UserName
    username: string;
    role: Role | string;
    metadata?: {
        major?: Major;
        [key: string]: any;
    };
};

export type UserName = {
    first: string;
    middle?: string;
    last: string;
};

export type Major = {
    _id?: string;
    name: Lang;
    acronym: string;
    detail: Lang;
    school: School | string;
};

export type School = {
    _id: string;
    name: Lang;
    acronym: string;
    detail: Lang;
    photos: Photo;
};

export type Photo = {
    first: string;
    second: string;
    third: string;
    fourth: string;
};
