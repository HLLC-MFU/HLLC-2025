import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RoleDocument = HydratedDocument<Role>;

export enum Actions {
  Read = 'read',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
}

type BasePermission = `${string}:${Actions}`;
type IdPermission = `${string}:${Actions}:id`;
export type Permission = BasePermission | IdPermission;

@Schema({ timestamps: true })
export class Role {
  /**
 * The name of the role.
 * This should be unique and descriptive.
 * @example "Admin"
 * @example "Editor"
 */
  @Prop({ required: true, unique: true })
  name: string;

  /**
 * The permissions associated with the role.
 * Each permission should be a string formatted as "resource:action" or "resource:action:id".
 * @example ["user:create", "user:update:id"]
 */
  @Prop({ type: [String], default: [] })
  permissions: string[];

  /**
 * The metadata schema for the role.
 * This defines additional properties that can be associated with the role.
 * Each property should specify its type, label, and whether it is required.
 * @example "major": { "type": "string", "label": "major", "required": true }
 */
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
/**
 * Remove __v and metadataSchema from the JSON representation
 */
RoleSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    delete ret.metadataSchema;
    return ret;
  },
});
