import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId } from "mongodb";
import { HydratedDocument } from "mongoose";

export type AssessmentAnswerDocument = HydratedDocument<AssessmentAnswer>;

@Schema({ timestamps: true, collection: 'assessment-answers', })
export class AssessmentAnswer {
    @Prop({ required: true, type: ObjectId })
    user: ObjectId;

    @Prop([{ _id: false, assessment: { type: ObjectId, ref: 'Assessment', required: true,}, answer: { type: String, required: true } }])
    answers: { assessment: ObjectId, answer: string }[];
}

export const AssessmentAnswerSchema = SchemaFactory.createForClass(AssessmentAnswer);