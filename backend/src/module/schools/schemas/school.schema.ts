import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Localization } from 'src/pkg/types/localize';
import { Photo } from 'src/pkg/types/photos';
export type SchoolDocument = HydratedDocument<School>;

@Schema({ timestamps: true })
export class School {
  // Name of school (Localization)
  @Prop({ required: true, unique: true, type: Object })
  name: Localization;

  // Acronym of school (Localization)
  @Prop({ required: true, unique: true, type: Object })
  acronym: Localization;

  // Detail of school (Localization)
  @Prop({ required: true, unique: true, type: Object })
  detail: Localization;

  // Photo of school (Photo)
  @Prop({ required: true, type: Object })
  photo: Photo;
}

export const SchoolSchema = SchemaFactory.createForClass(School);
