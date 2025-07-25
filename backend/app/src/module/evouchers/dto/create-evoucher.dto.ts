import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsDateString,
  IsMongoId,
  IsObject,
} from 'class-validator';
import { EvoucherType } from '../enum/evoucher-type.enum';

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

  @IsString()
  sponsor: string;

  @IsOptional()
  type: EvoucherType;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}

export class AddEvoucherCodeDto {
  @IsMongoId()
  userId: string;
}

export class AddEvoucherCodeByRoleDto {
  roleId: string;
}