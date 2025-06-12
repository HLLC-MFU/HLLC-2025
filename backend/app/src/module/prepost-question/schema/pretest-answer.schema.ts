import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type PretestAnswerDocument = HydratedDocument<PretestAnswer>

@Schema({_id: false})
class Answer{

    @Prop({ required:true, type: Types.ObjectId, ref:'Question', unique:true})
    question: Types.ObjectId

    @Prop({ required:true, type: String})
    answer: string
}

@Schema({ timestamps: true , collection: "pre-test-answer"})
export class PretestAnswer {
    @Prop({ required:true, type:Types.ObjectId, ref: 'User'})
    user: Types.ObjectId

    @Prop({ required:true, type:[Answer]})
    answers: Answer[]
}

export const PretestAnswerSchema = SchemaFactory.createForClass(PretestAnswer)