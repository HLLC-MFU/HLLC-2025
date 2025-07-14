import { Question, QuestionType, DisplayType, StudentDetail, TransformedAnswer } from "@/types/assessment";

export type QuestionSummaryResponse = {
    assessment: {
        _id: string;
        type: string;
        question: {
            en: string;
            th: string;
        };
        order: number;
        createdAt: string;
        updatedAt: string;
    };
    average: number;
    count: number;
};

export type AssessmentAnswer = {
    _id: string;
    user: {
        _id: string;
        name: {
            first: string;
            middle?: string;
            last: string;
        };
        username: string;
        role: string;
        metadata: {
            major?: {
                _id: string;
                name: {
                    th: string;
                    en: string;
                };
                acronym: string;
                school: {
                    _id: string;
                    name: {
                        th: string;
                        en: string;
                    };
                    acronym: string;
                };
            };
        };
    };
    answers: Array<{
        assessment: string;
        answer: string;
    }>;
    createdAt: string;
    updatedAt: string;
};

export type AssessmentAnswerResponse = {
    data: AssessmentAnswer[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        lastUpdatedAt: string;
    };
    message: string;
};

export type ExtendedStudentDetail = StudentDetail & {
    userType: string;
};

export type QuestionStat = {
    _id: string;
    type: QuestionType;
    displayType: DisplayType;
    question: {
        en: string;
        th: string;
    };
    order: number;
    banner: null;
    createdAt: string;
    updatedAt: string;
    averageScore: number;
    totalAnswers: number;
}; 