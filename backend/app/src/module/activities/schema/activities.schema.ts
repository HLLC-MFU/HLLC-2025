import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Localization, Photo } from 'src/pkg/types/common';

export type ActivityDocument = HydratedDocument<Activities>;

@Schema({ timestamps: true })
export class Activities {
  @Prop({ required: true, type: Object })
  fullName: Localization;

  @Prop({ required: true, type: Object })
  shortName: Localization;

  @Prop({ required: true, type: Object })
  fullDetails: Localization;

  @Prop({ required: false, type: Object })
  shortDetails: Localization;

  @Prop({ required: true, type: String })
  type: string;

  @Prop({ required: false, type: Object })
  photo: Photo;

  @Prop({ required: false, type: String })
  location?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const ActivitiesSchema = SchemaFactory.createForClass(Activities);

// Create indexes for better query performance
ActivitiesSchema.index({ type: 1 });
ActivitiesSchema.index({ tags: 1 });
ActivitiesSchema.index({
  'fullName.th': 'text',
  'fullName.en': 'text',
  'shortName.th': 'text',
  'shortName.en': 'text',
  'fullDetails.th': 'text',
  'fullDetails.en': 'text',
});
