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
    name: Lang;
    acronym: string;
    order: number;
    startAt: string;
    endAt: string;
    detail: Lang;
    photo: {
        front: string;
        back: string;
        home: string;
    };
    amount: number;
    sponsor: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
    
    // Optional fields for backward compatibility
    discount?: string;
    type?: EvoucherType;
    sponsors?: Sponsors;
    expiration?: string;
    status?: EvoucherStatus;
    metadata?: Record<string, string>;
    claims?: {
        maxClaim: number;
        currentClaim: number;
    };
    maxClaims?: number;
} 