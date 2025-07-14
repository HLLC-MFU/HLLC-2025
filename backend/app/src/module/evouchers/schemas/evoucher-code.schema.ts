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

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Evoucher', index: true })
  evoucher: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, string | number>;
}

export const EvoucherCodeSchema = SchemaFactory.createForClass(EvoucherCode);
EvoucherCodeSchema.index({ code: 1, isUsed: 1, user: 1, evoucher: 1 }, { unique: true });
