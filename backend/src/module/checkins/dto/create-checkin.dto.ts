import { Type } from "class-transformer";
import { 
  IsDateString, 
  IsEnum, 
  IsMongoId, 
  IsNotEmpty, 
  IsNumber, 
  IsObject, 
  IsOptional, 
  IsString, 
  ValidateNested 
} from "class-validator";
import { Types } from "mongoose";

export class CheckinLocationDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class CreateCheckinDto {
  // User who checked in
  @IsNotEmpty()
  @IsMongoId()
  user: string | Types.ObjectId;

  // Activity related to this checkin
  @IsNotEmpty()
  @IsMongoId()
  activity: string | Types.ObjectId;

  // Checkin timestamp
  @IsOptional()
  @IsDateString()
  checkinTime?: string;

  // Checkout timestamp (if applicable)
  @IsOptional()
  @IsDateString()
  checkoutTime?: string;

  // Status of the checkin
  @IsOptional()
  @IsEnum(['pending', 'approved', 'rejected', 'completed'])
  status?: string;

  // Additional notes
  @IsOptional()
  @IsString()
  notes?: string;

  // Checkin location data
  @IsOptional()
  @ValidateNested()
  @Type(() => CheckinLocationDto)
  location?: CheckinLocationDto;

  // Staff who approved/processed this checkin
  @IsOptional()
  @IsMongoId()
  processedBy?: string | Types.ObjectId;

  // Processing timestamp
  @IsOptional()
  @IsDateString()
  processedAt?: string;

  // Custom fields for flexibility
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
