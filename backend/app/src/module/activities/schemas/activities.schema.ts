import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';
import { Localization, Photo } from 'src/pkg/types/common';

export type ActivityDocument = HydratedDocument<Activities>;

@Schema({ _id: false })
export class ActivityScope {
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

  @Prop()
  startAt: Date;

  @Prop()
  endAt: Date;

  @Prop()
  checkinStartAt: Date;
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

  @Prop({
    type: ActivityMetadata,
    default: () => ({
      isOpen: true,
      isProgressCount: false,
      isVisible: true,
      scope: {},
    }),
  })
  metadata: ActivityMetadata;
}

export const ActivitiesSchema = SchemaFactory.createForClass(Activities);
