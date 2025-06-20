import { Lang } from "./lang";
import { Sponsors } from "./sponsors";

export enum EvoucherType {
    GLOBAL = 'GLOBAL',
    INDIVIDUAL = 'INDIVIDUAL'
}

export enum EvoucherStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE'
}

export type Evoucher = {
    _id: string;
    discount: string;
    acronym: string;
    type: EvoucherType;
    sponsors: Sponsors;
    detail: Lang;
    expiration: string;
    photo: {
        coverPhoto: string;
    };
    maxClaims?: number;
    status: EvoucherStatus;
    metadata?: Record<string, string>;
    claims: {
        maxClaim: number;
        currentClaim: number;
    };
    createdAt: string;
    updatedAt: string;
} 