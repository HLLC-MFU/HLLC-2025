import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReportDocument = Report & Document;

@Schema({ timestamps: true })
export class Report {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporter_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ReportCategory', required: true })
  category_id: Types.ObjectId;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true, maxlength: 50 })
  status: string;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
