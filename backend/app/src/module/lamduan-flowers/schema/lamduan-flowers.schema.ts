import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { Photo } from "src/pkg/types/common";
import { LamduanSetting } from "./lamduan.setting";

export type LamduanFlowersDocument = HydratedDocument<LamduanFlowers>;
@Schema({ timestamps: true })
export class LamduanFlowers {

    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    user: Types.ObjectId;

    @Prop({ required: true, type: String })
    comment: String;

    @Prop({ required: true, type: Object })
    photo: Photo;

    @Prop({ required: true, type: Types.ObjectId, ref: 'LamduanSetting' })
    setting: LamduanSetting
}

export const LamduanFlowersSchema = SchemaFactory.createForClass(LamduanFlowers)