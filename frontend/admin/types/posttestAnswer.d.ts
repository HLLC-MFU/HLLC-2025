import { User } from './user';
import { PrepostQuestions } from './prepostQuestion'

export type PottestAnswer = {
    _id: string;
    user: User
    answers: Answers[];
};

type Answers = {
    posttest: PrepostQuestions;
    answer: string;
};

export type PotestAverage = {
    posttest: PrepostQuestions;
    average: number;
    count: number;
};
