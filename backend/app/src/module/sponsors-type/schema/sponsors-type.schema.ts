import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type SponsorsTypeDocument = HydratedDocument<SponsorsType>;

@Schema({ timestamps: true })
export class SponsorsType {

    @Prop({ required: true, type: String })
    name: string;
    
}

export const SponsorsTypeSchema = SchemaFactory.createForClass(SponsorsType);