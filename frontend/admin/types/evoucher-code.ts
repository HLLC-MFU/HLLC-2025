import { Evoucher } from "./evoucher";
import { Sponsors } from "./sponsors";

export enum EvoucherCodeStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    USED = 'USED'
}

export type EvoucherCode = {
    _id: string;
    code: string;
    evoucher: Evoucher;
    sponsors: Sponsors;
    status: EvoucherCodeStatus;
    usedBy?: string;
    usedAt?: string;
    createdAt: string;
    updatedAt: string;
} 