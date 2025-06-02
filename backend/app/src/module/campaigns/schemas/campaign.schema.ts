import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Localization, Photo } from "src/pkg/types/common";
import { status } from "../enum/status.enum";

export type CampaignDocument = HydratedDocument<Campaign>;


@Schema({ timestamps: true })
export class Campaign {
    @Prop({ required: true, unique: true, type: Object })
    name: Localization;

    @Prop({ required: true, type: Object })
    detail: Localization;

    @Prop({ required: true, type: Number, default: 0 })
    budget: number;

    @Prop({ required: true, type: String })
    image: string

    @Prop({ type: String, enum: Object.values(status), default: status.DRAFT })
    status: status.DRAFT | status.ACTIVE | status.COMPLETED

    @Prop({ required: true, type: Date })
    startAt: Date

    @Prop({ required: true, type: Date })
    endAt: Date
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);