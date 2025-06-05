export interface Campaign {
    _id: string;
    name: {
        th: string;
        en: string;
    };
    detail: {
        th: string;
        en: string;
    };
    budget: number;
    image: string;
    status: "draft" | "active" | "completed";
    startAt: string;
    endAt: string;
    createdAt: string;
    updatedAt: string;
} 