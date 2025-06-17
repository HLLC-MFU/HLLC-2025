import { Evoucher } from "./evoucher";

export enum EvoucherCodeStatus {
    ACTIVE = 'ACTIVE',
    USED = 'USED',
    EXPIRED = 'EXPIRED'
}

export interface EvoucherCode {
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