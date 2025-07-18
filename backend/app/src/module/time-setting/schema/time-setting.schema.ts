import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type TimeSettingDocument = HydratedDocument<TimeSetting>;

@Schema({ timestamps: true, collection: 'time-setting' })
export class TimeSetting {
    @Prop({ required: true, type: Date })
    date: Date
}

export const TimeSettingSchema = SchemaFactory.createForClass(TimeSetting);
