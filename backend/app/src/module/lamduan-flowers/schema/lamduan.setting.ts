import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Photo } from "src/pkg/types/common";

export type LamduanFlowersSettingDocument = HydratedDocument<LamduanFlowersSetting>;

@Schema({ timestamps: true })
export class LamduanFlowersSetting {

    @Prop({ required: true, Types: Object })
    TutorialPhoto: Photo;

    @Prop({ required: true, Types: String })
    TutorialVideo: string;

    @Prop({ required: true, Types: Date })
    StartAt: Date

    @Prop({ required: true, Types: Date })
    EndAt: Date
}

export const LamduanFlowersSettingSchema = SchemaFactory.createForClass(LamduanFlowersSetting);