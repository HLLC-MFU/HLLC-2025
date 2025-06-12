import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";
import { AssessmentTypes } from "../enum/assessment-types.enum";
import { Localization } from "src/pkg/types/common";

export type AssessmentDocument = HydratedDocument<Assessment>;

@Schema({ timestamps: true })
export class Assessment {

    @Prop({ required: true, type: Object, })
    question: Localization;

    @Prop({ required: true, type: String, enum: AssessmentTypes })
    type: AssessmentTypes;

    @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Activities' })
    activity: Types.ObjectId;

    @Prop({ required: true, type: Number, default: 1 })
    order: number;
}

export const AssessmentSchema = SchemaFactory.createForClass(Assessment);

AssessmentSchema.index({ activity: 1, question: 1 }, { unique: true });
AssessmentSchema.index({ activity: 1, order: 1 }, { unique: true });