import { IsNotEmpty, IsString, IsObject, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

import { Localization, Photo } from 'src/pkg/types/common';

export class ActivityScopeDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  major?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  school?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  user?: string[];
}

export class ActivityMetadataDto {
  @IsBoolean()
  @IsOptional()
  isOpen?: boolean;

  @IsBoolean()
  @IsOptional()
  isProgressCount?: boolean;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @IsOptional()
  scope?: ActivityScopeDto;
}

export class CreateActivitiesDto {
  @IsObject()
  @IsNotEmpty()
  name: Localization;

  @IsString()
  @IsNotEmpty()
  acronym: string;

  @IsObject()
  @IsNotEmpty()
  fullDetails: Localization;

  @IsObject()
  @IsNotEmpty()
  shortDetails: Localization;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsObject()
  @IsNotEmpty()
  photo: Photo;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsOptional()
  @IsObject()
  @IsNotEmpty()
  @Type(() => ActivityMetadataDto)
  metadata?: ActivityMetadataDto;
}
