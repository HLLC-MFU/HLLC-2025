import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types, Schema as MongooseSchema } from "mongoose";

export type EvoucherCodeDocument = HydratedDocument<EvoucherCode>;

@Schema({ timestamps: true })
export class EvoucherCode {

    @Prop({ required: true, type: String, unique: true })
    code: string;

    @Prop({ type: [MongooseSchema.Types.ObjectId], default: [] })
    user: MongooseSchema.Types.ObjectId[];

    @Prop({ required: true, type: Types.ObjectId, ref: 'Evoucher'})
    evoucher: Types.ObjectId

    @Prop({ required: true, type: Boolean, default: false })
    isUsed: boolean;

    @Prop({ type: Object })
    metadata: Record<string, string>
}

export const EvoucherCodeSchema = SchemaFactory.createForClass(EvoucherCode);