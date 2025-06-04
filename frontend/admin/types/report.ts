export interface Category {
    id: string;
    name: {
        en: string;
        th: string;
    };
    description: {
        en: string;
        th: string;
    };
    color: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Problem {
    id: string;
    title: {
        en: string;
        th: string;
    };
    description: {
        en: string;
        th: string;
    };
    categoryId: string;
    status: 'Pending' | 'In Progress' | 'Resolved';
    createdAt: Date;
    updatedAt: Date;
}

export interface Report {
    id: string;
    title: string;
    description: string;
    problems: Problem[];
    createdAt: Date;
    updatedAt: Date;
} 