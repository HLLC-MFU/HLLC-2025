import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type PreTestAnswerDocument = HydratedDocument<PreTestAnswer>

@Schema()
class Answer{

    @Prop({ required:true, type: Types.ObjectId, ref:'', unique:true})
    pretest: Types.ObjectId

    @Prop({ required:true, type: String})
    answer: string
}

@Schema({ timestamps: true , collection: "Pre-test-answer"})
export class PreTestAnswer {
    @Prop({ required:true, type:Types.ObjectId, ref: 'User'})
    user: Types.ObjectId

    @Prop({ required:true, type:[Answer]})
    answers: Answer[]
}

export const PreTestAnswerSchema = SchemaFactory.createForClass(PreTestAnswer)