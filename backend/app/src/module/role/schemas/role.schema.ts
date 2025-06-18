import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RoleDocument = HydratedDocument<Role>;

export enum Actions {
  Read = 'read',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  All = '*',
}

type BasePermission = `${string}:${Actions}`;
type IdPermission = `${string}:${Actions}:id`;
type WildcardPermission = '*' | `${string}:*`;
export type Permission = BasePermission | IdPermission | WildcardPermission;

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
   * Each permission should be a string formatted as:
   * - "resource:action" (e.g., "users:create")
   * - "resource:action:id" (e.g., "users:update:id")
   * - "resource:*" (all actions for a resource)
   * - "*" (all actions for all resources)
   * @example ["*"] for superadmin
   * @example ["users:*"] for full user management
   * @example ["users:create", "users:update:id"] for specific permissions
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

  /**
   * The metadata schema for the role.
   * This defines additional properties that can be associated with the role.
   * Each property should specify its type, label, and whether it is required.
   * @example "major": { "type": "string", "label": "major", "required": true }
   */
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
