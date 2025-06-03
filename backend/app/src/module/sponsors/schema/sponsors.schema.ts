import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { Localization, Photo } from "src/pkg/types/common";

export type SponsorsDocument = HydratedDocument<Sponsors>;


@Schema({ timestamps: true })
export class Sponsors {

    @Prop({ required: true, type: Object })
    name: Localization;

    @Prop({ required: true, type: Object })
    photo: Photo;

    @Prop({ required: true, type: Types.ObjectId, ref: 'SponsorsType' })
    type: Types.ObjectId;

    @Prop({ required: true, type: Boolean, default: true })
    isShow: boolean;

    @Prop({ type: Object, default: {} })
    metadata: Record<string, string>;
}

export const SponsorsSchema = SchemaFactory.createForClass(Sponsors);