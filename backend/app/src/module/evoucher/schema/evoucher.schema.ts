import { Prop, Schema } from "@nestjs/mongoose";

@Schema({ timestamps: true })
export class Evoucher {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true })
    image: string;
}