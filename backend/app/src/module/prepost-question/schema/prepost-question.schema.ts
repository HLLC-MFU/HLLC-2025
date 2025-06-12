import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { PrepostTypes } from "../enum/posttest-types.enum";
import { Localization } from "src/pkg/types/common";
import { PrepostQuestionTypes } from "../enum/prepost-question-typs.enum";

export type PrepostQuestionDocument = HydratedDocument<PrepostQuestion>

@Schema({ timestamps: true, collection: "prepost-question" })
export class PrepostQuestion {

    @Prop({ required: true, type: String, enum: PrepostQuestionTypes })
    displaytype: PrepostQuestionTypes

    @Prop({ require: true, type: String, enum: PrepostTypes })
    type: PrepostTypes;

    @Prop({ require: true, type: Object, unique: true })
    question: Localization;

    @Prop({ require: true, type: Number, default: 1, unique: true })
    order: number;

}

export const PrepostQuestionSchema = SchemaFactory.createForClass(PrepostQuestion)