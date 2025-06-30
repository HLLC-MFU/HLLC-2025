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
    user?: User | string;
    evoucher?: Evoucher | string;
    isUsed: boolean;
    metadata: Record<string, string>;
    createdAt: string;
    updatedAt: string;
} 