import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, HydratedDocument } from "mongoose";
import { Localization } from "src/pkg/types/common";

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification extends Document {

    @Prop({ required: true, type: Object})
    title: Localization;

    @Prop({ required: true})
    body: string;
    
    @Prop({ required: true})
    targetToken: string;

    // data?: Record<string, any>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);