import { HydratedDocument, Types } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User } from "src/module/users/schemas/user.schema";
import { Activity } from "src/module/activites/schemas/activities.schema";

export type CheckinDocument = HydratedDocument<Checkin>;

@Schema({ _id: false })
export class CheckinLocation {
    @Prop({ type: String })
    description?: string;

    @Prop({ type: Number })
    latitude?: number;

    @Prop({ type: Number })
    longitude?: number;
}

@Schema({ timestamps: true })
export class Checkin {
    // User who checked in
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    user: Types.ObjectId;

    // Activity related to this checkin
    @Prop({ type: Types.ObjectId, ref: 'Activity', required: true, index: true })
    activity: Types.ObjectId;

    // Checkin timestamp
    @Prop({ type: Date, default: Date.now, index: true })
    checkinTime: Date;

    // Status of the checkin
    @Prop({ type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending', index: true })
    status: string;

    // Additional notes
    @Prop({ type: String })
    notes?: string;

    // Checkin location data
    @Prop({ type: CheckinLocation })
    location?: CheckinLocation;

    // Staff who approved/processed this checkin
    @Prop({ type: Types.ObjectId, ref: 'User' })
    processedBy?: Types.ObjectId;

    // Processing timestamp
    @Prop({ type: Date })
    processedAt?: Date;

    // Custom fields for flexibility
    @Prop({ type: Object, default: {} })
    metadata: Record<string, any>;
}

export const CheckinSchema = SchemaFactory.createForClass(Checkin);

// Create indexes for better query performance
CheckinSchema.index({ user: 1, activity: 1 }, { unique: true });
CheckinSchema.index({ activity: 1, status: 1 });
CheckinSchema.index({ checkinTime: -1 });
CheckinSchema.index({ 'metadata.field': 1 }); // Index for common metadata field searches