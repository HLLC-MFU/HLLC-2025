import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type StepCounterDocument = HydratedDocument<StepCounter>;

@Schema({ timestamps: true })
export class StepCounter {

    @Prop({ required: true, type: Types.ObjectId, ref: 'User' , unique: true})
    user: Types.ObjectId;

    @Prop({ required: true, type: Number, default: 0 })
    stepCount: number;

}

export const StepCounterSchema = SchemaFactory.createForClass(StepCounter);