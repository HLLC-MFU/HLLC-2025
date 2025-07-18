import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Localization, Photo } from 'src/pkg/types/common';

export type LamduanSettingDocument = HydratedDocument<LamduanSetting>;

@Schema({
  collection: 'lamduan-settings',
  timestamps: true,
})
export class LamduanSetting {
  @Prop({ required: true, type: Object })
  tutorialPhoto: Photo;

  @Prop({ required: true })
  tutorialVideo: string;

  @Prop({ required: true, type: Date })
  startAt: Date;

  @Prop({ required: true, type: Date })
  endAt: Date;

  @Prop({ required: true , type: Object })
  description : Localization;
}

export const LamduanSettingSchema =
  SchemaFactory.createForClass(LamduanSetting);
