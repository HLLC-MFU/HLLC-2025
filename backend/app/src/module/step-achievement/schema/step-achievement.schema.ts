import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Date, HydratedDocument } from "mongoose";

export type StepAchievementDocument = HydratedDocument<StepAchievement>;

@Schema({ timestamps: true, collection: 'step-achievement' },)
export class StepAchievement {
    @Prop({ required: true, type: Number })
    achievement: number

    @Prop({ required: true, type: Date, default: () => Date.now() })
    startAt: Date;

    @Prop({ required: true, type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) })
    endAt: Date;
}

export const StepAchievementSchema = SchemaFactory.createForClass(StepAchievement);
