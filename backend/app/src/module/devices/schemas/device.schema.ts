import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, SchemaTypes, Document, HydratedDocument } from 'mongoose';

export type DeviceDocument = HydratedDocument<Device>;

@Schema({ timestamps: true })
export class Device extends Document {
    
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  deviceId: string;

  @Prop({ required: true })
  fcmToken: string;

  @Prop({ required: true })
  platform: string;
  
  @Prop({ default: 'en' })
  language: string;

  @Prop()
  deviceName?: string;

  @Prop()
  osVersion?: string;

  @Prop()
  appVersion?: string;

}

export const DeviceSchema = SchemaFactory.createForClass(Device);

DeviceSchema.index({ userId: 1 });
DeviceSchema.index({ deviceId: 1 });
DeviceSchema.index({ fcmToken: 1 });
