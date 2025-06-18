import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ActivitiesTypeDocument = HydratedDocument<ActivitiesType>;

@Schema({ timestamps: true })
export class ActivitiesType {
  @Prop({ required: true, type: String })
  name: string;
}

export const ActivitiesTypeSchema =
  SchemaFactory.createForClass(ActivitiesType);
