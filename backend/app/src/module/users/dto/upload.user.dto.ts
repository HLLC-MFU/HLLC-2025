import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';

class UserNameDto {
  @IsString()
  @IsNotEmpty()
  first: string;

  @IsOptional()
  @IsString()
  middle?: string;

  @IsOptional()
  @IsString()
  last?: string;
}

class UserUploadDto {
  @IsObject()
  @ValidateNested()
  @Type(() => UserNameDto)
  name: UserNameDto;

  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsOptional()
  @IsMongoId()
  major?: string;

  @IsOptional()
  @IsString()
  province?: string;
}

export class UploadUserDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserUploadDto)
  users: UserUploadDto[];

  @IsOptional()
  @IsMongoId()
  major?: string | Types.ObjectId;

  @IsMongoId()
  @IsNotEmpty()
  role: string | Types.ObjectId;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}