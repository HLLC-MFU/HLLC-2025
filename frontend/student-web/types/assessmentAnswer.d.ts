export type AssessmentAnswer = {
  _id: string;
  answers: Answers[];
};

type Answers = {
  assessment: string;
  answer: string;
};
