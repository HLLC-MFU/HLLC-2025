import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
// 
export type ReportDocument = HydratedDocument<Report>

@Schema({ timestamps: true })
export class Report {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporter: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ReportType', required: true })
  category: Types.ObjectId;

  @Prop({ required: true, type: String })
  message: string; 

  @Prop({ required: true, maxlength: 50 , default: 'pending'})
  status: string;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
