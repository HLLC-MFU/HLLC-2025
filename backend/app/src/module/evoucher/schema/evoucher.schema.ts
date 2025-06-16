import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { Localization, Photo } from "src/pkg/types/common";

export enum EvoucherType {
  GLOBAL = 'GLOBAL',
  INDIVIDUAL = 'INDIVIDUAL'
}

export enum EvoucherStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export type EvoucherDocument = HydratedDocument<Evoucher>;

@Schema({ timestamps: true })
export class Evoucher {

    @Prop({ required: true, type: Number, default: 0 })
    discount: number;

    @Prop({ required: true, type: String })
    acronym: string;

    @Prop({ required: true, type: String, enum: Object.values(EvoucherType) })
    type: EvoucherType;

    @Prop({ required: true, type: Types.ObjectId, ref: 'Sponsors' })
    sponsors: Types.ObjectId;

    @Prop({ required: true, type: Object })
    detail: Localization;

    @Prop({ required: true, type: Date })
    expiration: Date;

    @Prop({ required: true, type: Object })
    photo: Photo;

    @Prop({ type: Number, required: false })
    maxClaims?: number;

    @Prop({ type: String, enum: Object.values(EvoucherStatus), default: EvoucherStatus.ACTIVE })
    status: EvoucherStatus;

    @Prop({ type: Object, default: {} })
    metadata: Record<string, string>;
}

export const EvoucherSchema = SchemaFactory.createForClass(Evoucher);