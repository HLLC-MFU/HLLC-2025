export interface Campaign {
    _id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    budget: number;
    status: "draft" | "active" | "completed";
    createdAt: string;
    updatedAt: string;
} 