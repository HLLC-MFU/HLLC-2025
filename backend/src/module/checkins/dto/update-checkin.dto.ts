import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { CreateCheckinDto } from './create-checkin.dto';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class UpdateCheckinDto extends PartialType(CreateCheckinDto) {
  // Allow updating specifically the status and isCheckedIn flag
  @IsOptional()
  @IsEnum(['pending', 'success', 'failed', 'duplicate'])
  status?: string;

  @IsOptional()
  @IsBoolean()
  isCheckedIn?: boolean;
}

// Special DTO for manual check-in verification by staff
export class VerifyCheckinDto {
  @IsNotEmpty()
  @IsEnum(['success', 'failed', 'duplicate'])
  status: string;

  @IsNotEmpty()
  @IsBoolean()
  isCheckedIn: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

// For offline syncing of multiple check-ins
export class OfflineCheckinDto extends CreateCheckinDto {
  @IsNotEmpty()
  @IsString()
  localId: string = '';

  @IsNotEmpty()
  @IsString()
  deviceId: string = '';

  @IsNotEmpty()
  @IsBoolean()
  isOfflineSync: boolean = true;
}

// DTO for batch syncing multiple check-ins from offline devices
export class BatchCheckinDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OfflineCheckinDto)
  checkins: OfflineCheckinDto[];
}
