import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: true,
    type: {
      first: { type: String, required: true, unique: false },
      middle: { type: String, required: false, unique: false },
      last: { type: String, required: false, unique: false },
    },
    _id: false,
  })
  name: {
    first: string;
    middle?: string;
    last?: string;
  };

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: false, select: false, default: '' })
  password: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Role' })
  role: Types.ObjectId;

  @Prop({ type: String || null, default: null, select: false })
  refreshToken: string | null;

  @Prop({ type: SchemaTypes.Mixed, default: {} })
  metadata: Record<string, string>;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ updatedAt: -1 });

UserSchema.pre('save', async function (next) {
  
  if (!this.isModified('password')) return next();

  if (this.password === '') return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});
UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.refreshToken;
    delete ret.__v;
    return ret;
  },
});