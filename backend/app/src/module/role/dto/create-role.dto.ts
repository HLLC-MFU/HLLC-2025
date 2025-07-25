import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsObject,
} from 'class-validator';

export class CreateRoleDto {
  /**
   * The name of the role.
   * This should be unique and descriptive.
   * @example "Admin"
   * @example "Editor"
   */
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * The permissions associated with the role.
   * Each permission should be a string formatted as "resource:action" or "resource:action:id".
   * @example ["user:create", "user:update:id"]
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  /**
   * The metadata schema for the role.
   * This defines additional properties that can be associated with the role.
   * Each property should specify its type, label, and whether it is required.
   * @example "major": { "type": "string", "label": "major", "required": true }
   */
  @IsOptional()
  @IsObject()
  metadataSchema?: Record<
    string,
    {
      type: 'string' | 'number' | 'boolean' | 'date';
      label?: string;
      required?: boolean;
    }
  >;

  /**
   * ใช้สำหรับ config scan
   * เช่น ใครสามารถ scan role ไหนได้บ้าง
   * @example { "metadata": { canCheckin: { user: [*], major: [majorId], school: [schoolId] } } }
   */
  @IsOptional()
  @IsObject()
  metadata?: Record<
    string,
    {
      canCheckin?: {
        user: string[],   /// ["*"]
        school: string[], /// [schoolId]
        major: string[]   /// [majorId]
      }
    }
  >;
}
