import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SponsorsTypeDocument = HydratedDocument<SponsorsType>;

@Schema({ timestamps: true, collection: 'sponsor-types' })
export class SponsorsType {
  @Prop({ required: true, type: String, unique: true })
  name: string;

  @Prop({ required: true, type: Number, unique: true })
  priority: number;
}

export const SponsorsTypeSchema = SchemaFactory.createForClass(SponsorsType);
