import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type EvoucherCodeDocument = HydratedDocument<EvoucherCode>;
@Schema({
  collection: 'evoucher-codes',
  timestamps: true,
})
export class EvoucherCode {
  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop({ required: true, default: false })
  isUsed: boolean;

  @Prop({ type: Date, default: null })
  usedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user: Types.ObjectId;
}

export const EvoucherCodeSchema = SchemaFactory.createForClass(EvoucherCode);
EvoucherCodeSchema.index({ code: 1, isUsed: 1 }, { unique: true });
