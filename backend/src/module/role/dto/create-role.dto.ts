import { IsNotEmpty, IsOptional, IsString, IsArray, IsObject } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  name: string; // เช่น "student", "admin"

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[]; // เช่น ["user:create", "event:view"]

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
}
