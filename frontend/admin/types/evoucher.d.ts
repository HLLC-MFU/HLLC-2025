import { EvoucherType } from "./evoucher-type";
import { Lang } from "./lang";
import { Photo } from "./photo";
import { Sponsors } from "./sponsors";

export type Evoucher = {
    _id: string;
    discount: number;
    acronym: string;
    type: EvoucherType;
    sponsors: Sponsors;
    detail: Lang;
    expiration: Date;
    photo: Photo;
};