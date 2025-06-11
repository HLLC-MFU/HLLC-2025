import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type PostTestAnswerDocument = HydratedDocument<PostTestAnswer>;

@Schema()
class Answer{

    @Prop({ required: true, type: Types.ObjectId, ref:'Posttest', unique: true})
    posttest: Types.ObjectId

    @Prop({ required: true, type: String})
    value: string
}

@Schema({ timestamps: true, collection: "post-test-answer"})
export class PostTestAnswer {

    @Prop({ required: true, type: Types.ObjectId, ref: 'User'})
    user: Types.ObjectId

    @Prop({ required: true, type: [Answer]})
    values: Answer[]
}

export const PostTestAnswerSchema = SchemaFactory.createForClass(PostTestAnswer)