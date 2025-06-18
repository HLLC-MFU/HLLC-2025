import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type EvoucherCodeSequenceDocument = HydratedDocument<EvoucherCodeSequence>;

@Schema({ timestamps: true })
export class EvoucherCodeSequence {
    @Prop({ required: true, unique: true })
    prefix: string;

    @Prop({ required: true, default: 0 })
    lastNumber: number;
}

export const EvoucherCodeSequenceSchema = SchemaFactory.createForClass(EvoucherCodeSequence); 