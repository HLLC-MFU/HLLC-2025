import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Localization, Location } from "src/pkg/types/common";

export type LandmarkDocument = HydratedDocument<Landmark>;

@Schema({ timestamps: true })
export class Landmark {

    @Prop({ required: true, type: Object, unique: true })
    name: Localization;

    @Prop({ required: true, type: Object })
    hint: Localization;

    @Prop({ required: true, type: Object })
    location: Location;

}

export const LandmarkSchema = SchemaFactory.createForClass(Landmark);