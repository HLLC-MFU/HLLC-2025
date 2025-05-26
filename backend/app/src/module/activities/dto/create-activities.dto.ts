import { IsNotEmpty, IsArray, IsString, IsObject } from 'class-validator';

import { Localization, Photo } from 'src/pkg/types/common';

export class CreateActivitiesDto {
  @IsObject()
  @IsNotEmpty()
  fullName: Localization;

  @IsObject()
  @IsNotEmpty()
  shortName: Localization;

  @IsObject()
  @IsNotEmpty()
  fullDetails: Localization;

  @IsObject()
  @IsNotEmpty()
  shortDetails: Localization;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  createdBy: string;

  @IsObject()
  @IsNotEmpty()
  photo: Photo;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsArray()
  @IsNotEmpty()
  tags: string[];

  @IsObject()
  @IsNotEmpty()
  metadata: Record<string, any>;
}
