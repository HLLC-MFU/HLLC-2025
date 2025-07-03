import { Evoucher } from "./evoucher";
import { User } from "./user";

export type EvoucherCode = {
    _id: string;
    code: string;
    isUsed: boolean;
    usedAt: Date;
    user?: User | string;
    evoucher?: Evoucher | string;
} 