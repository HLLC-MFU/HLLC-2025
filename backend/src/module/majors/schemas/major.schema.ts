import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { Localization } from "src/pkg/types/localize";


export type MajorDocument = HydratedDocument<Major>;


@Schema({ timestamps: true })
export class Major {

    // Name of major (Localization)
    @Prop({ required: true, unique: true, type: Object })
    name: Localization;

    // Acronym of major (Localization)
    @Prop({ required: true, unique: true, type: Object })
    acronym: Localization;

    // Detail of major (Localization)
    @Prop({ required: true, unique: true, type: Object })
    detail: Localization;

    // School of major (School)
    @Prop({ required: true, type: Types.ObjectId, ref: 'School' })
    school: Types.ObjectId
}

export const MajorSchema = SchemaFactory.createForClass(Major);
