import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";
import { PosttestTypes } from "../enum/Post-testTypes.enum";
import { Localization } from "src/pkg/types/common";

export type posttestDocument = HydratedDocument<Posttest>

@Schema({ timestamps: true , collection: "Post-Test"})
export class Posttest {

    @Prop({ require: true, type: String, enum: PosttestTypes })
    type: PosttestTypes;

    @Prop({ require: true, type: Object, unique: true })
    question: Localization;

    @Prop({ require: true, type: Number, default: 1, unique:true })
    order: number;

}

export const PosttestSchema = SchemaFactory.createForClass(Posttest)