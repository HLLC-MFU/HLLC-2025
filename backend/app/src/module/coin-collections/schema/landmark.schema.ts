import { Prop, raw, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Localization, Location } from "src/pkg/types/common";

export type LandmarkDocument = HydratedDocument<Landmark>;

@Schema({ timestamps: true })
export class Landmark {

    @Prop({ required: true, type: Object, unique: true })
    name: Localization;

    @Prop({ required: true, type: Object })
    hint: Localization;

    @Prop({ required: true, type: String })
    hintImage: string;

    @Prop(raw({
        latitude: { type: Number, required: true, },
        longitude: { type: Number, required: true},
    }),)
    location: Location;

    @Prop({ required: true, type: Number, default: 0 })
    coinAmount: number;

    @Prop({ required: true, type: Number, default: 0 })
    cooldown: number;
}

export const LandmarkSchema = SchemaFactory.createForClass(Landmark);