import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SchoolDocument = HydratedDocument<School>;

@Schema({ timestamps: true })
export class School {
  @Prop({ required: true, unique: true, type: Object })
  name: {
    th: string;
    en: string;
  };

  @Prop({ required: true, unique: true })
  acronym: string;

  @Prop({ required: true, unique: true, type: Object })
  detail: {
    th: string;
    en: string;
  };

  @Prop({ unique: true })
  photo: string;
}

export const SchoolSchema = SchemaFactory.createForClass(School);
