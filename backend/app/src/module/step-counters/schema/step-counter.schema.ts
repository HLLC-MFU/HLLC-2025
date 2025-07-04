import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StepCounterDocument = HydratedDocument<StepCounter>;
@Schema({ _id: false, timestamps: true })
class Step {
  @Prop({ required: false, type: Number })
  totalStep: number;

  @Prop({ required: true, type: Date })
  date: Date;

  @Prop({ required: true, type: Number })
  step: number;

  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;
}
@Schema({ timestamps: true, collection: 'step-counters' })
export class StepCounter {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  user: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'StepAchievement' })
  achievement: Types.ObjectId;

  @Prop({ required: true })
  deviceId: string;

  @Prop({ required: true, type: Boolean, default: false })
  completeStatus: boolean;

  @Prop({ type: Number })
  rank: number;

  @Prop({
    type: [
      {
        totalStep: Number,
        step: Number,
        date: Date,
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  steps: Step[];
}

export const StepCounterSchema = SchemaFactory.createForClass(StepCounter);
