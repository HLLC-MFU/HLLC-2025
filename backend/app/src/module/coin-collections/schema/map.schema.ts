import { Prop, Schema } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { SchemaFactory } from "@nestjs/mongoose";

export type MapDocument = HydratedDocument<Map>;

@Schema({ timestamps: true })
export class Map {
    @Prop({ required: true, type: String })
    map: string;
}

export const MapSchema = SchemaFactory.createForClass(Map);
