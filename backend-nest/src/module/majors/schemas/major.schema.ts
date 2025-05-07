import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type MajorDocument = HydratedDocument<Major>;


@Schema({ timestamps: true })
export class Major {
    @Prop({ required: true, unique: true, type: Object })
    name: {
        th: string
        en: string
    }

    @Prop({ required: true, unique: true })
    acronym: string

    @Prop({ required: true, unique: true, type: Object })
    detail: {
        th: string
        en: string
    }

    @Prop({ required: true, type: Types.ObjectId, ref: 'School' })
    school: Types.ObjectId
}

export const MajorSchema = SchemaFactory.createForClass(Major);
