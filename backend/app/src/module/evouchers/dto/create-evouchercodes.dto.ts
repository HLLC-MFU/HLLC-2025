import { IsString, IsBoolean, IsOptional, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

export class CreateEvoucherCodeDto {
  @IsString()
  code: string;

  @IsBoolean()
  @IsOptional()
  isUsed?: boolean;

  @IsOptional()
  usedAt?: Date | null;

  @IsMongoId()
  @IsOptional()
  user?: Types.ObjectId | string;

  @IsMongoId()
  @IsOptional()
  evoucher?: Types.ObjectId | string;
}
