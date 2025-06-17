import { Evoucher } from "./evoucher";
import { User } from "./user";

export enum EvoucherCodeStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    USED = 'USED'
}

export type EvoucherCode = {
    _id: string;
    code: string;
    user: User;
    evoucher: Evoucher;
    isUsed: boolean;
    metadata: {
        expiration: string;
    };
    createdAt: string;
    updatedAt: string;
} 