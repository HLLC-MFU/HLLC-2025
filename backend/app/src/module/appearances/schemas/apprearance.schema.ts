import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type ApprearanceDocument = HydratedDocument<Appearance>;

@Schema({ timestamps: true, strict: false })
export class Appearance {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'School', required: true })
  school: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  colors: Record<string, string>;

  @Prop({ type: Object, default: {} })
  assets: Record<string, string>;
}

export const ApprearanceSchema = SchemaFactory.createForClass(Appearance);

ApprearanceSchema.index({ school: 1 }, { unique: true });
