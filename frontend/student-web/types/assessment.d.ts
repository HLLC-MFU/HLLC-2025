import { Lang } from "./lang";

export type Assessment = {
    _id: string;
    question: Lang;
    type: AssessmentTypes;
    activity: string;
    order: number;
}

enum AssessmentTypes {
    TEXT = 'text',
    RATING = 'rating',
    DROPDOWN = 'dropdown',
    CHECKBOX = 'checkbox',
    RADIO = 'radio',
}
