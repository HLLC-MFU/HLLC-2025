import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PosttestAnswerDocument = HydratedDocument<PosttestAnswer>;

@Schema({ _id: false })
class Answer {
  @Prop({ required: true, type: Types.ObjectId, ref: 'PrepostQuestion' })
  posttest: Types.ObjectId;

  @Prop({ required: true, type: String })
  answer: string;
}

@Schema({ timestamps: true, collection: 'posttest-answer' })
export class PosttestAnswer {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  user: Types.ObjectId;

  @Prop({ required: true, type: [Answer] })
  answers: Answer[];
}

export const PosttestAnswerSchema =
  SchemaFactory.createForClass(PosttestAnswer);
