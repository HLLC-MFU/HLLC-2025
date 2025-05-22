import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, HydratedDocument } from "mongoose";

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification extends Document {

    @Prop({ required: true, type: Object})
    title: {
        th: string;
        en: string;
    };

    @Prop({ required: true})
    body: string;
    
    
    @Prop({ required: true})
    targetToken: string;

    // data?: Record<string, any>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);