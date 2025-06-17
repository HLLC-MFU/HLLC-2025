import { Sponsors } from "./sponsors";

export enum EvoucherType {
    GLOBAL = 'GLOBAL',
    INDIVIDUAL = 'INDIVIDUAL'
}

export enum EvoucherStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE'
}

export interface Evoucher {
    _id: string;
    discount: string;
    acronym: string;
    type: EvoucherType;
    sponsors: Sponsors;
    detail: {
        en: string;
        th: string;
    };
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