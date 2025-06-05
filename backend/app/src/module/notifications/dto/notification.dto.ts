import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Localization } from 'src/pkg/types/common';

export class RedirectButtonDto {
  @IsObject()
  @IsNotEmpty()
  label: Localization;

  @IsString()
  @IsNotEmpty()
  url: string;
}

export class TargetDto {
  @IsEnum(['school', 'major', 'individual'])
  type: 'school' | 'major' | 'individual';

  @IsArray()
  @IsNotEmpty({ each: true })
  id: string[];
}

export class CreateNotificationDto {
  @IsObject()
  @IsNotEmpty()
  title: Localization;

  @IsObject()
  @IsNotEmpty()
  subtitle: Localization;

  @IsObject()
  @IsNotEmpty()
  body: Localization;

  @IsString()
  @IsNotEmpty()
  icon: string;

  @IsString()
  @IsOptional()
  image?: string;

  @ValidateNested()
  @IsOptional()
  @Type(() => RedirectButtonDto)
  redirectButton?: RedirectButtonDto;

  @IsNotEmpty()
  scope: 'global' | TargetDto[];
}
