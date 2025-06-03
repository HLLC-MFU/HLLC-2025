// src/module/users/dto/user-upload-direct.dto.ts
import { Type } from 'class-transformer';
import {
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

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

export class UserUploadDirectDto {
  @IsObject()
  @ValidateNested()
  @Type(() => UserNameDto)
  name: UserNameDto;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  password: string;

  @IsMongoId()
  @IsNotEmpty()
  role: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}
