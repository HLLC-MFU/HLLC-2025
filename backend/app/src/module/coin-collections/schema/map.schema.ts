import { Prop, Schema } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { SchemaFactory } from "@nestjs/mongoose";

export type MapDocument = HydratedDocument<Map>;

@Schema({ timestamps: true })
export class Map {
    @Prop({ required: true, type: String })
    map: string;
    
    @Prop({ required: true, type: Number })
    x: string

    @Prop({ required: true, type: Number })
    y: string

    @Prop({ required: true, type: String })
    mapUrl: string

    @Prop({ required: true, type: Types.ObjectId })
    landmark: Types.ObjectId

}

export const MapSchema = SchemaFactory.createForClass(Map);
