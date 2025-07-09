import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Localization } from 'src/pkg/types/common';

type EvoucherPhoto = {
  front: string;
  back: string;
  home: string;
};

export type EvoucherDocument = HydratedDocument<Evoucher>;
@Schema({
  collection: 'evouchers',
  timestamps: true,
})
export class Evoucher {
  @Prop({ required: true, unique: true, index: true, type: Object })
  name: Localization;

  @Prop({ required: true, unique: true, type: String })
  acronym: string;

  @Prop({ required: true, type: Number })
  order: number;

  @Prop({ required: true, type: Date })
  startAt: Date;

  @Prop({ required: true, type: Date })
  endAt: Date;

  @Prop({ required: true, type: Object })
  detail: Localization;

  @Prop({ required: true, type: Object })
  photo: EvoucherPhoto;

  @Prop({ required: true, type: Number })
  amount: number;

  @Prop({ type: Types.ObjectId, ref: 'Sponsors' })
  sponsor: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, string>;
}

export const EvoucherSchema = SchemaFactory.createForClass(Evoucher);
EvoucherSchema.index({ acronym: 1, code: 1 }, { unique: true });
