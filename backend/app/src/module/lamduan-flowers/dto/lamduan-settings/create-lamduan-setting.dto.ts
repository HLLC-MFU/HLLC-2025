import { IsNotEmpty, IsObject, IsString, IsDateString } from 'class-validator';
import { Localization, Photo } from 'src/pkg/types/common';

export class CreateLamduanSettingDto {
  @IsObject()
  @IsNotEmpty()
  tutorialPhoto: Photo;

  @IsString()
  @IsNotEmpty()
  tutorialVideo: string;

  @IsDateString()
  @IsNotEmpty()
  startAt: string;

  @IsDateString()
  @IsNotEmpty()
  endAt: string;

  @IsObject()
  @IsNotEmpty()
  description : Localization;
}
