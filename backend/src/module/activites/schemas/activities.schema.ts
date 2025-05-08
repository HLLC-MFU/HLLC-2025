import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { Localization } from "src/pkg/types/localize";
import { Photo } from "src/pkg/types/photos";
export type ActivityDocument = HydratedDocument<Activity>;

@Schema({ timestamps: true })
export class Activity {

    // Name of activity (Localization)
    @Prop({ required: true, unique: true, type: Object })
    name: Localization;

    // Full - Detail of activity (Localization)
    @Prop({ required: true, unique: true, type: Object })
    fullDetails: Localization;

    // Short - Detail of activity (Localization)
    @Prop({ required: false, type: Object })
    shortDetails?: Localization;

    // Photoes - Activity photos
    @Prop({ required: true, type: Object })
    photos: Photo;

    // Activity type
    @Prop({ required: true, type: String })
    type: string;

    @Prop({ required: false, type: Boolean, default: false })
    isOpen: boolean; // if the activity is currently open for pparticipants

    @Prop({ required: false, type: Boolean, default: false })
    isInProgress: boolean; // if the activity is currently in progress

    @Prop({ required: false, type: Boolean, default: false})
    isVisible: boolean; // if the activity is currently visible to the public

}
export const ActivitySchema = SchemaFactory.createForClass(Activity);