export interface ReportTypes {
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