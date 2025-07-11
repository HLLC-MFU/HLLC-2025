import { Type } from "class-transformer";
import { IsArray, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import { Localization } from "src/pkg/types/common";

export class ReceiversDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tokens?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  devices?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  users?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  schools?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  majors?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  roles?: string[];
}

export class PushNotificationDto {
  @ValidateNested()
  @Type(() => ReceiversDto)
  receivers: ReceiversDto | 'global';

  @IsObject()
  @IsNotEmpty()
  title: Localization;

  @IsObject()
  @IsNotEmpty()
  body: Localization;

  @IsString()
  @IsOptional()
  image?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsOptional()
  @IsEnum(['normal', 'high'])
  priority?: 'normal' | 'high';

  @IsOptional()
  @IsNumber()
  badge?: number;
}
