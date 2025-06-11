import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";
import { AssessmentTypes } from "../enum/assessmentTypes.enum";

export type AssessmentDocument = HydratedDocument<Assessment>;

@Schema({ timestamps: true })
export class Assessment {

    @Prop({ require: true, type: String, unique: true })
    question: string;

    @Prop({ require: true, type: String, enum: AssessmentTypes })
    type: AssessmentTypes;

    @Prop({ require: true, type: SchemaTypes.ObjectId, ref: 'Activities' })
    activity: Types.ObjectId;

    @Prop({ require: true, type: Number, default: 1})
    order: number;

    @Prop({ type: String, default: null })
    banner: string;
}

export const AssessmentSchema = SchemaFactory.createForClass(Assessment);