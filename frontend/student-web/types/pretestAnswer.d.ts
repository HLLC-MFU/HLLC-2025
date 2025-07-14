export type PretestAnswer = {
    _id: string;
    answers: Answers[];
};

type Answers = {
    pretest: string;
    answer: string;
};
