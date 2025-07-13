import { Prop, raw, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Localization } from "src/pkg/types/common";
import { LandmarkType } from "../enum/landmark-types.enum";
import { Location, mapCoordinate } from "src/pkg/types/activity";

export type LandmarkDocument = HydratedDocument<Landmark>;

@Schema({ timestamps: true })
export class Landmark {

    @Prop({ required: true, type: Object, unique: true })
    name: Localization;

    @Prop({ required: true, type: Number, unique: true })
    order: number

    @Prop({ required: true, type: String })
    coinImage: string;

    @Prop({ required: true, type: Object })
    hint: Localization;

    @Prop({ required: true, type: String })
    hintImage: string;

    @Prop(raw({
        latitude: { type: Number, required: true, },
        longitude: { type: Number, required: true },
        mapUrl: { type: String, required: true }
    }),)
    location: Location;

    @Prop({ required: true, type: Number, default: 0 })
    cooldown: number;

    @Prop({ required: true, type: Number, default: 50 })
    limitDistance: number

    @Prop({ required: true, type: String, enum: LandmarkType })
    type: LandmarkType;

    @Prop(raw({
        x: { type: Number, required: true, },
        y: { type: Number, required: true },
    }),)
    mapCoordinates: mapCoordinate;
}

export const LandmarkSchema = SchemaFactory.createForClass(Landmark);