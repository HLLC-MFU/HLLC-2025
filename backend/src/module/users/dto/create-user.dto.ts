import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  ValidateNested,
  IsMongoId,
} from 'class-validator';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';

class NameDto {
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

class UserMetadataDto {
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

  // อื่นๆ ตามที่ role กำหนด
  [key: string]: any;
}

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
  role: Types.ObjectId | string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserMetadataDto)
  metadata?: UserMetadataDto;
}
