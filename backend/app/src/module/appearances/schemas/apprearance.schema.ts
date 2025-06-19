import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type AppearanceDocument = HydratedDocument<Appearance>;

@Schema({
  timestamps: true,
  collection: 'appearances',
})
export class Appearance {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'School', required: true })
  school: Types.ObjectId;

  @Prop({ type: Object, default: {}, required: true })
  colors: Record<string, string>;

  @Prop({ type: Object, default: {}, required: true })
  assets: Record<string, string>;
}

export const AppearanceSchema = SchemaFactory.createForClass(Appearance);

AppearanceSchema.index({ school: 1 }, { unique: true });
