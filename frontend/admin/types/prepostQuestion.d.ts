import { Lang } from "./lang";

export type PrepostQuestions = {
    _id: string
    displayType: PrepostQuestionTypes;
    type: PrepostTypes;
    question: Lang;
    order: number;
}
export enum PrepostTypes {
    TEXT = 'text',
    RATING = 'rating',
    DROPDOWN = 'dropdown',
    CHECKBOX = 'checkbox',
    RADIO = 'radio',
}

export enum PrepostQuestionTypes {
    BOTH = 'both',
    PRE = 'pretest',
    POST = 'posttest',
}