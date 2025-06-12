import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type PosttestAnswerDocument = HydratedDocument<PosttestAnswer>;

@Schema()
class Answer{

    @Prop({ required: true, type: Types.ObjectId, ref:'Posttest', unique: true})
    posttest: Types.ObjectId

    @Prop({ required: true, type: String})
    answer: string
}

@Schema({ timestamps: true, collection: "post-test-answer"})
export class PosttestAnswer {

    @Prop({ required: true, type: Types.ObjectId, ref: 'User'})
    user: Types.ObjectId

    @Prop({ required: true, type: [Answer]})
    answers: Answer[]
}

export const PosttestAnswerSchema = SchemaFactory.createForClass(PosttestAnswer)