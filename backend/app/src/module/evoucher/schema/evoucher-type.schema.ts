import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EvoucherTypeDocument = HydratedDocument<EvoucherType>;

@Schema({ timestamps: true })
export class EvoucherType {
  
    @Prop({ required: true})
    name: string;
}

export const EvoucherTypeSchema = SchemaFactory.createForClass(EvoucherType);