import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SystemStatusDocument = HydratedDocument<SystemStatus>;

@Schema({ timestamps: true })
export class SystemStatus {
  @Prop({ required: true, type: Boolean })
  status: boolean;
}

export const SystemStatusSchema = SchemaFactory.createForClass(SystemStatus);
