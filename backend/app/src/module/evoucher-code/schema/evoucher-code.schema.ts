import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type EvoucherCodeDocument = HydratedDocument<EvoucherCode>;

@Schema({ timestamps: true })
export class EvoucherCode {

    @Prop({ required: true, type: String, unique: true })
    code: string;

    @Prop({ required: true, type: Boolean, default: false })
    isUsed: boolean;

    @Prop({ required: true, type: Object })
    metadata: {
        user?: string; // Optional for GLOBAL vouchers
        evoucher: string; // Required - reference to EVoucher
    };

}

export const EvoucherCodeSchema = SchemaFactory.createForClass(EvoucherCode);