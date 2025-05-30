import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Model, Types } from 'mongoose';
// 
export type ReportDocument = HydratedDocument<Report>

@Schema({ timestamps: true })
export class Report {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporter: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ReportCategory', required: true })
  category: Types.ObjectId;

  @Prop({ required: true })
  message: string; 

  @Prop({ required: true, maxlength: 50 })
  status: string;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
