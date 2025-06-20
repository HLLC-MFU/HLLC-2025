import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type InterfacesDocument = HydratedDocument<Interfaces>;

@Schema({ timestamps: true })
export class Interfaces {
    @Prop({ required: true, type: Types.ObjectId, ref: "School" })
    school: Types.ObjectId;

    @Prop({ required: true, type: Object, default: {} })
    assets: Record<string, string>;
}

export const InterfacesSchema = SchemaFactory.createForClass(Interfaces);