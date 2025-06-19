import { Prop, Schema } from "@nestjs/mongoose";
import { SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

export type CoinCollectionDocument = HydratedDocument<CoinCollection>
@Schema({ timestamps: true })
export class CoinCollection {

    @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User' })
    user: Types.ObjectId;

    @Prop({ _id: false, type: [{ landmark: { type: SchemaTypes.ObjectId, ref: 'Landmark', required: true }, collectedAt: { type: Date, required: true } }], default: [] })
    landmarks: { landmark: Types.ObjectId; collectedAt: Date; }[];

}

export const CoinCollectionSchema = SchemaFactory.createForClass(CoinCollection);
