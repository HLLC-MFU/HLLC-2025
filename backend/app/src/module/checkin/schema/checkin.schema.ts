import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CheckinDocument = HydratedDocument<Checkin>;

@Schema({ timestamps: true })
export class Checkin {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  user: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  staff: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Activities' })
  activity: Types.ObjectId;
}

export const CheckinSchema = SchemaFactory.createForClass(Checkin);
CheckinSchema.index({ user: 1, activity: 1 }, { unique: true });
