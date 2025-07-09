import { Assessment } from "./assessment";
import { User } from "./user.d.ts";

export type AssessmentAnswer = {
    _id: string;
    answers: Answers[];
}

type Answers = {
    assessment: string;
    answer: string;
}