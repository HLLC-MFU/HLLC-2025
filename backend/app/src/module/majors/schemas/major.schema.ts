import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Localization } from 'src/pkg/types/common';
export type MajorDocument = HydratedDocument<Major>;

@Schema({ timestamps: true })
export class Major {
  @Prop({ required: true, unique: true, type: Object })
  name: Localization;

  @Prop({ required: true, unique: true })
  acronym: string;

  @Prop({ required: true, type: Object })
  detail: Localization;

  @Prop({ required: true, type: Types.ObjectId, ref: 'School' })
  school: Types.ObjectId;
}

export const MajorSchema = SchemaFactory.createForClass(Major);
