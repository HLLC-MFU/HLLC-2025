import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";
import { PosttestTypes } from "../enum/Post-testTypes.enum";
import { Localization } from "src/pkg/types/common";

export type posttestDocument = HydratedDocument<PostTest>

@Schema({ timestamps: true })
export class PostTest {

    @Prop({ require: true, type: String, enum: PosttestTypes })
    type: PosttestTypes;

    @Prop({ require: true, type: Object, unique: true })
    question: Localization;

    @Prop({ require: true, type: Number, default: 1, unique:true })
    order: number;

    @Prop({ type: String, default: null })
    banner: string;
}

export const PosttestSchema = SchemaFactory.createForClass(PostTest)