import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type StepCounterDocument = HydratedDocument<StepCounter>;
@Schema({ _id: false, timestamps: true })
class Step {
    @Prop({ required: false, type: Number })
    totalStep: number

    @Prop({ required: true, type: Date })
    date: Date;

    @Prop({ required: true, type: Number })
    step: number
}
@Schema({ timestamps: true, collection: 'step-counters' })
export class StepCounter {

    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    user: Types.ObjectId;

    @Prop({ required: true, type: Types.ObjectId, ref: 'StepAchievement' })
    achievement: Types.ObjectId

    @Prop({ required: true, type: Boolean, default: false })
    completeStatus: boolean

    @Prop({ required: true, type: [Step] })
    step: Step[]
}

export const StepCounterSchema = SchemaFactory.createForClass(StepCounter);