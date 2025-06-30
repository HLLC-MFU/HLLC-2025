import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type StepAchievementDocument = HydratedDocument<StepAchievement>;

@Schema({ timestamps: true, collection: 'step-achievement' },)
export class StepAchievement {
    @Prop({ required: true, type: Number })
    achievement: number
}

export const StepAchievementSchema = SchemaFactory.createForClass(StepAchievement);
