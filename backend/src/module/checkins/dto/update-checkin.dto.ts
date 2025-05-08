import { PartialType } from '@nestjs/mapped-types';
import { CreateCheckinDto } from './create-checkin.dto';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateCheckinDto extends PartialType(CreateCheckinDto) {
  id: number;
  // Allow updating specifically the status
  @IsOptional()
  @IsEnum(['pending', 'approved', 'rejected', 'completed'])
  status?: string;
}

// Special DTO for approving or rejecting checkins
export class ProcessCheckinDto {
  @IsNotEmpty()
  @IsEnum(['approved', 'rejected', 'completed'])
  status: string;

  @IsOptional()
  notes?: string;
}

// Special DTO for checkout
export class CheckoutDto {
  @IsOptional()
  notes?: string;
}
