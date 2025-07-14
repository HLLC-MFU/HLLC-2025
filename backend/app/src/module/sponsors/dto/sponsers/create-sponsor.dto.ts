import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
} from 'class-validator';
import { Types } from 'mongoose';
import { Localization, Photo } from 'src/pkg/types/common';

export class CreateSponsorDto {
  @IsObject()
  @IsNotEmpty()
  name: Localization;

  @IsObject()
  @IsNotEmpty()
  logo: Photo;

  @IsMongoId()
  @IsNotEmpty()
  type: Types.ObjectId;

  @IsNumber()
  @IsNotEmpty()
  priority: number;

  @IsOptional()
  @IsObject()
  color: {
    primary: string;
    secondary: string;
  };
}
