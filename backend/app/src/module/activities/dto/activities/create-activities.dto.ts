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
  @Type(() => ActivityScopeDto)
  scope?: ActivityScopeDto;

  @IsOptional()
  @Type(() => Date)
  startAt?: Date;

  @IsOptional()
  @Type(() => Date)
  endAt?: Date;
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

  @IsObject()
  @IsNotEmpty()
  location: Localization;

  @IsOptional()
  @Type(() => ActivityMetadataDto)
  metadata?: ActivityMetadataDto;
}