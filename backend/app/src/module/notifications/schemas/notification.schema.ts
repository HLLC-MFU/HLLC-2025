import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { Localization } from 'src/pkg/types/common';

export type NotificationDocument = HydratedDocument<Notification>;

class RedirectButton {
  @Prop({ type: Object, required: true })
  label: Localization;

  @Prop({ type: String, required: true })
  url: string;
}

class Target {
  @Prop({
    type: String,
    enum: ['school', 'major', 'individual'],
    required: true,
  })
  type: 'school' | 'major' | 'individual';

  @Prop({ type: [SchemaTypes.ObjectId], required: true })
  id: Types.ObjectId[];
}

@Schema({ timestamps: true, versionKey: false })
export class Notification extends Document {
  @Prop({ type: Object, required: true })
  title: Localization;

  @Prop({ type: Object, required: true })
  subtitle: Localization;

  @Prop({ type: Object, required: true })
  body: Localization;

  @Prop({ type: String, required: true })
  icon: string;

  @Prop({ type: String, default: '' })
  image: string;

  @Prop({ type: RedirectButton, required: false })
  redirectButton?: RedirectButton;

  @Prop({ type: SchemaTypes.Mixed, required: true })
  scope: 'global' | Target[];
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ 'scope.type': 1, 'scope.id': 1 });
