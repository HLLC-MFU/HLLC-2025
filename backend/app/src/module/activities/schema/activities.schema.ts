import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';
import { Localization, Photo } from 'src/pkg/types/common';

export type ActivityDocument = HydratedDocument<Activities>;

@Schema({ _id: false })
class ActivityScope {
  @Prop({ type: [MongooseSchema.Types.ObjectId], default: [] })
  major: MongooseSchema.Types.ObjectId[];

  @Prop({ type: [MongooseSchema.Types.ObjectId], default: [] })
  school: MongooseSchema.Types.ObjectId[];

  @Prop({ type: [MongooseSchema.Types.ObjectId], default: [] })
  user: MongooseSchema.Types.ObjectId[];
}

@Schema({ _id: false })
class ActivityMetadata {
  @Prop({ default: true })
  isOpen: boolean;
  
  @Prop({ default: false })
  isProgressCount: boolean;

  @Prop({ default: true })
  isVisible: boolean;

  @Prop({ type: ActivityScope, default: { major: [], school: [], user: [] } })
  scope: ActivityScope;
}

@Schema({ timestamps: true })
export class Activities {
  @Prop({ type: Object, required: true })
  name: Localization;

  @Prop({ required: true })
  acronym: string;

  @Prop({ type: Object, required: true })
  fullDetails: Localization;

  @Prop({ type: Object, required: true })
  shortDetails: Localization;

  @Prop({ type: Types.ObjectId, ref: 'ActivitiesType', required: true })
  type: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  photo: Photo;

  @Prop({ type: Object, required: true })
  location: Localization;

  @Prop({ type: ActivityMetadata, default: () => ({
    isOpen: true,
    isProgressCount: false,
    isVisible: true,
    scope: {
      major: [],
      school: [],
      user: [],
    }
  })})
  metadata: ActivityMetadata;
}

export const ActivitiesSchema = SchemaFactory.createForClass(Activities);

// Indexes
ActivitiesSchema.index({ type: 1 });
ActivitiesSchema.index({ acronym: 1 });
ActivitiesSchema.index({
  'name.th': 'text',
  'name.en': 'text',
  'fullDetails.th': 'text',
  'fullDetails.en': 'text',
  'shortDetails.th': 'text',
  'shortDetails.en': 'text',
});
ActivitiesSchema.index({ 'metadata.scope.major': 1 });
ActivitiesSchema.index({ 'metadata.scope.school': 1 });
ActivitiesSchema.index({ 'metadata.scope.user': 1 });
