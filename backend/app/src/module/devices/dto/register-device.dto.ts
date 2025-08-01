import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterDeviceDto {

  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsString()
  @IsNotEmpty()
  fcmToken: string;

  @IsString()
  @IsNotEmpty()
  platform: string;

  @IsString()
  language: string;

  @IsOptional()
  @IsString()
  deviceName?: string;

  @IsOptional()
  @IsString()
  osName?: string;

  @IsOptional()
  @IsString()
  osVersion?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  appVersion?: string;

  @IsOptional()
  @IsString()
  buildNumber?: string;
}
