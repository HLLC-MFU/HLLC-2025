import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EvoucherTypeDocument = HydratedDocument<EvoucherType>;

@Schema({ timestamps: true })
export class EvoucherType {
  
    @Prop({ required: true})
    name: string;

    @Prop({ required: true })
    key: string; // เช่น 'global', 'individual', 'invite-only'

    @Prop({ required: false })
    description: string;

    @Prop({ default: false })
    isClaimable: boolean; // ระบุว่า user สามารถกดรับเองได้หรือไม่

    @Prop({ type: Object, default: {} })
    metadata: Record<string, string>;
}

export const EvoucherTypeSchema = SchemaFactory.createForClass(EvoucherType);