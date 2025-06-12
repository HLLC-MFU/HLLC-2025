import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type PreTestAnswerDocument = HydratedDocument<PreTestAnswer>

@Schema()
class Answer{

    @Prop({ required:true, type: Types.ObjectId, ref:'', unique:true})
    pretest: Types.ObjectId

    @Prop({ required:true, type: String})
    value: string
}

@Schema({ timestamps: true})
export class PreTestAnswer {
    @Prop({ required:true, type:Types.ObjectId, ref: 'User'})
    user: Types.ObjectId

    @Prop({ required:true, type:[Answer]})
    values: Answer[]
}

export const PreTestAnswerSchema = SchemaFactory.createForClass(PreTestAnswer)