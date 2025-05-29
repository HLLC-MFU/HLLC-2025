import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { Localization, Photo } from "src/pkg/types/common";

export type EvoucherDocument = HydratedDocument<Evoucher>;

@Schema({ timestamps : true})
export class Evoucher {

    @Prop({ required: true, type: Number, default: 0})
    discount: number;

    @Prop({ required: true, type: String })
    acronym: string;

    @Prop({ required: true, type: Types.ObjectId, ref: 'EvoucherType'})
    type: Types.ObjectId;

    @Prop({ required: true, type: Types.ObjectId, ref: 'Sponsors'})
    sponsors: Types.ObjectId;

    @Prop({ required: true, type: Object})
    detail: Localization;

    @Prop({ required: true, type: Date})
    expiration: Date;

    @Prop({ required: true, type: Object})
    photo: Photo;

    @Prop({ type: Object, default: {} })
    metadata: Record<string, any>;
}

export const EvoucherSchema = SchemaFactory.createForClass(Evoucher);