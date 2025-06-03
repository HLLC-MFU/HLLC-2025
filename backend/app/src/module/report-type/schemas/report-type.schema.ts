import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Localization } from 'src/pkg/types/common';


export type ReportTypeDocument = HydratedDocument<ReportType>;

@Schema()
export class ReportType {
  @Prop({ required: true, type: Object })
  name: Localization;
}

export const ReportTypeSchema = SchemaFactory.createForClass(ReportType);