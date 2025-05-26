import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RoleDocument = HydratedDocument<Role>;

export enum Actions {
  Read = 'read',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
}

@Schema({ timestamps: true })
export class Role {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ type: Object, default: {} })
  metadataSchema: Record<
    string,
    {
      type: 'string' | 'number' | 'boolean' | 'date';
      label?: string;
      required?: boolean;
    }
  >;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
RoleSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    delete ret.metadataSchema;
    return ret;
  },
});
