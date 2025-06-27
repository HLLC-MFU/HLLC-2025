import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsDateString,
} from 'class-validator';

class LocalizationDto {
  @IsString()
  @IsNotEmpty()
  en: string;

  @IsString()
  @IsNotEmpty()
  th: string;
}

class EvoucherPhotoDto {
  @IsString()
  // @IsNotEmpty()
  front: string;

  @IsString()
  // @IsNotEmpty()
  back: string;

  @IsString()
  // @IsNotEmpty()
  home: string;
}

export class CreateEvoucherDto {
  @ValidateNested()
  @Type(() => LocalizationDto)
  private readonly name: LocalizationDto;

  @IsString()
  @IsNotEmpty()
  acronym: string;

  @IsNumber()
  order: number;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  @ValidateNested()
  @Type(() => LocalizationDto)
  detail: LocalizationDto;

  @ValidateNested()
  @Type(() => EvoucherPhotoDto)
  photo: EvoucherPhotoDto;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  sponsor?: string;
}
