import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Localization, Photo } from 'src/pkg/types/common';
export type SchoolDocument = HydratedDocument<School>;

@Schema({ timestamps: true })
export class School {
  @Prop({ required: true, unique: true, type: Object })
  name: Localization;

  @Prop({ required: true, unique: true })
  acronym: string;

  @Prop({ required: true, type: Object })
  detail: Localization;

  @Prop({ type: Object })
  photos: Photo;
}

export const SchoolSchema = SchemaFactory.createForClass(School);
SchoolSchema.index({ updatedAt: 1 });
SchoolSchema.virtual('majors', {
  ref: 'Major',
  localField: '_id',
  foreignField: 'school',
});
SchoolSchema.set('toObject', { virtuals: true });
SchoolSchema.pre('findOneAndDelete', async function (next) {
  const schoolId = this.getQuery()['_id'] as string;
  const MajorModel = this.model;
  await MajorModel.deleteMany({ school: schoolId });
  next();
});
SchoolSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.id;
    delete ret.__v;
    return ret;
  },
});
