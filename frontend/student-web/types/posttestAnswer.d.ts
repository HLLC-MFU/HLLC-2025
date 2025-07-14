export type PosttestAnswer = {
    _id: string;
    answers: Answers[];
};

type Answers = {
    posttest: string;
    answer: string;
};
