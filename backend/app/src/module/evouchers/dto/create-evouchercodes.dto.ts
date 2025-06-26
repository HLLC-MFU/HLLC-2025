import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class CreateEvoucherCodeDto {
  @IsString()
  code: string;

  @IsBoolean()
  @IsOptional()
  isUsed?: boolean;

  @IsOptional()
  usedAt?: Date | null;

  @IsString()
  @IsOptional()
  user?: Types.ObjectId | null;
}
