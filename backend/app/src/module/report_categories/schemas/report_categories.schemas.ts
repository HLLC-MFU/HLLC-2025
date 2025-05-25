import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Localization } from 'src/pkg/types/common';


export type ReportCategoryDocument = ReportCategory & Document;

@Schema()
export class ReportCategory {
  @Prop({ required: true, type: Object })
  name: Localization;
}

export const ReportCategorySchema = SchemaFactory.createForClass(ReportCategory);