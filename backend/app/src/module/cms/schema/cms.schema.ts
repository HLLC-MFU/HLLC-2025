import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

export type CmsDocument = CMS & Document;

@Schema()
export class CMS {
    @Prop({ type: Types.ObjectId, ref: "School", required: true })
    school: Types.ObjectId;

    @Prop({ type: Object, default: {}, required: true })
    assets: Record<string, string>;
}

export const CmsSchema = SchemaFactory.createForClass(CMS);