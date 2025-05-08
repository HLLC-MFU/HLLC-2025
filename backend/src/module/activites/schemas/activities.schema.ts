import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { Localization } from "src/pkg/types/localize";
import { Photo } from "src/pkg/types/photos";
export type ActivityDocument = HydratedDocument<Activity>;

// Define sub-document schemas
@Schema({ _id: false })
export class DateTimeRange {
  @Prop({ type: Date, required: true })
  start: Date;

  @Prop({ type: Date, required: true })
  end: Date;
}

@Schema({ _id: false })
export class ActivitySettings {
  @Prop({ type: DateTimeRange })
  registrationPeriod: DateTimeRange;
  
  @Prop({ type: DateTimeRange })
  activityPeriod: DateTimeRange;
  
  @Prop({ type: Boolean, default: true })
  isRegistrationRequired: boolean;
  
  @Prop({ type: Boolean, default: false })
  isAttendanceRequired: boolean;
  
  @Prop({ type: Object, default: {} })
  customSettings: Record<string, any>;
}

@Schema({ timestamps: true })
export class Activity {
    // Name of activity (Localization)
    @Prop({ required: true, type: Object })
    name: Localization;

    // Full - Detail of activity (Localization)
    @Prop({ required: true, type: Object })
    fullDetails: Localization;

    // Short - Detail of activity (Localization)
    @Prop({ required: false, type: Object })
    shortDetails?: Localization;

    // Photos - Activity photos
    @Prop({ required: true, type: Object })
    photos: Photo;

    // Activity type
    @Prop({ required: true, type: String, index: true })
    type: string;
    
    // Activity location
    @Prop({ type: String })
    location?: string;
    
    // Activity tags for filtering and categorization
    @Prop({ type: [String], default: [] })
    tags: string[];
    
    // Activity settings
    @Prop({ type: ActivitySettings, default: {} })
    settings: ActivitySettings;
    
    // Related organizations or departments
    @Prop({ type: [Types.ObjectId], ref: 'Organization', default: [] })
    organizations?: Types.ObjectId[];
    
    // Activity creator
    @Prop({ type: Types.ObjectId, ref: 'User' })
    createdBy?: Types.ObjectId;
    
    // Custom fields for flexibility
    @Prop({ type: Object, default: {} })
    metadata: Record<string, any>;

    // Status flags
    @Prop({ required: false, type: Boolean, default: false })
    isOpen: boolean; // if the activity is currently open for participants

    @Prop({ required: false, type: Boolean, default: false })
    isInProgress: boolean; // if the activity is currently in progress

    @Prop({ required: false, type: Boolean, default: false})
    isVisible: boolean; // if the activity is currently visible to the public
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);

// Create indexes for better query performance
ActivitySchema.index({ type: 1 });
ActivitySchema.index({ tags: 1 });
ActivitySchema.index({ 'name.th': 'text', 'name.en': 'text', 'fullDetails.th': 'text', 'fullDetails.en': 'text' });
ActivitySchema.index({ isVisible: 1, isOpen: 1 });
ActivitySchema.index({ 'settings.registrationPeriod.start': 1, 'settings.registrationPeriod.end': 1 });