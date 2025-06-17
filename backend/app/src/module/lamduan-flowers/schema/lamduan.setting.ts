import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Photo } from "src/pkg/types/common";

export type LamduanSettingDocument = HydratedDocument<LamduanSetting>;

@Schema({ timestamps: true })
export class LamduanSetting {

    @Prop({ required: true, type: Object })
    TutorialPhoto: Photo;

    @Prop({ required: true })
    TutorialVideo: string;

    @Prop({ required: true, type: Date })
    StartAt: Date

    @Prop({ required: true, type: Date })
    EndAt: Date
}

export const LamduanSettingSchema = SchemaFactory.createForClass(LamduanSetting);