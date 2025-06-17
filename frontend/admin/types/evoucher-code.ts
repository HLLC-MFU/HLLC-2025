import { Evoucher } from "./evoucher/d";

export enum EvoucherCodeStatus {
    ACTIVE = 'ACTIVE',
    USED = 'USED',
    EXPIRED = 'EXPIRED'
}

export type EvoucherCode = {
    _id: string;
    code: string;
    user?: string;
    evoucher: Evoucher;
    isUsed: boolean;
    metadata?: Record<string, string>;
    status: EvoucherCodeStatus;
    createdAt: string;
    updatedAt: string;
    usedAt?: string;
} 