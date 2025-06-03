import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  ValidateNested,
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
  role: Types.ObjectId;

  @IsNotEmpty()
  major: Types.ObjectId;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
