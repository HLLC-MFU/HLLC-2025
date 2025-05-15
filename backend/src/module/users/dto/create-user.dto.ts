import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  ValidateNested,
  IsMongoId,
  IsEmail,
} from 'class-validator';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';

/**
 * User name data transfer object
 */
export class NameDto {
  @IsNotEmpty()
  @IsString()
  first: string;

  @IsOptional()
  @IsString()
  middle?: string;

  @IsOptional()
  @IsString()
  last: string;
}

/**
 * User metadata data transfer object
 * Contains additional information about the user based on their role
 */
export class UserMetadataDto {
  @IsOptional()
  @IsMongoId()
  schoolId?: string | Types.ObjectId;

  @IsOptional()
  @IsMongoId()
  majorId?: string | Types.ObjectId;

  @IsOptional()
  @IsObject()
  school?: Record<string, any>;

  @IsOptional()
  @IsObject()
  major?: Record<string, any>;

  // Additional fields defined by role schema
  [key: string]: any;
}

/**
 * Create user data transfer object
 * Used when creating a new user in the system
 */
export class CreateUserDto {
  @ValidateNested()
  @Type(() => NameDto)
  name: NameDto;

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsNotEmpty()
  @IsMongoId()
  role: Types.ObjectId | string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserMetadataDto)
  metadata?: UserMetadataDto;
}
