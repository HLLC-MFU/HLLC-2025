import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as bcrypt from 'bcryptjs';
import { HydratedDocument, Types } from "mongoose";

export type UserDocument = HydratedDocument<User>;

/**
 * User schema for MongoDB
 * Contains core user information and references to related data
 */
@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, type: {
        first: { type: String, required: true, unique: false },
        middle: { type: String, required: false, unique: false },
        last: { type: String, required: false, unique: false }
    } })
    name: {
        first: string
        middle?: string
        last?: string
    }

    @Prop({ required: true, unique: true })
    username: string

    @Prop({})
    password: string

    @Prop({ required: false, unique: true, sparse: true })
    email?: string

    @Prop({ required: true, type: Types.ObjectId, ref: 'Role' })
    role: Types.ObjectId

    @Prop({ type: String || null, default: null })
    refreshToken: string | null

    @Prop({ 
      type: Object, 
      default: {},
      // ใช้ mongoose-lean-virtuals เพื่อให้ lean() ทำงานกับ virtuals properties
      _id: false 
    })
    metadata: {
      schoolId?: Types.ObjectId | string,
      school?: Record<string, any>, // ข้อมูล school เต็มๆ (จะเติมจาก cache)
      majorId?: Types.ObjectId | string,
      major?: Record<string, any>, // ข้อมูล major เต็มๆ (จะเติมจาก cache)
      [key: string]: any  // สำหรับ metadata อื่นๆ
    }
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes for better query performance
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ updatedAt: -1 });
UserSchema.index({ "metadata.schoolId": 1 });
UserSchema.index({ "metadata.majorId": 1 });

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});