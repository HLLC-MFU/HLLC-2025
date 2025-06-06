import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes, HydratedDocument } from 'mongoose';

export type NotificationReadDocument = HydratedDocument<NotificationRead>;

@Schema({
  collection: 'notification-reads',
  timestamps: true,
  versionKey: false,
})
export class NotificationRead extends Document {
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  userId: Types.ObjectId;

  @Prop({ type: [SchemaTypes.ObjectId], default: [] })
  readNotifications: Types.ObjectId[];
}

export const NotificationReadSchema =
  SchemaFactory.createForClass(NotificationRead);
