import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { PretestType } from "../enum/PretestType.enum";
import { Localization } from "src/pkg/types/common";
import { HydratedDocument } from "mongoose";

export type PreTestDocument = HydratedDocument<PreTest>

@Schema({ timestamps: true , collection: "Post-Test"})
export class PreTest {
    @Prop({ required: true, type: String, enum: PretestType})
    type: PretestType

    @Prop({ required: true, type: Object, unique: true})
    question: Localization

    @Prop({ required: true, type: Number, default: 1, unique: true})
    order: number;

}

export const PreTestSchema = SchemaFactory.createForClass(PreTest)
