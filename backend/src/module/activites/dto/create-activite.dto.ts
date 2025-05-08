import { Type } from "class-transformer";
import { 
  IsArray, 
  IsBoolean, 
  IsDateString, 
  IsMongoId, 
  IsNotEmpty, 
  IsNumber, 
  IsObject, 
  IsOptional, 
  IsString, 
  ValidateNested 
} from "class-validator";
import { Localization } from "src/pkg/types/localize";
import { Photo } from "src/pkg/types/photos";
import { Types } from "mongoose";

export class DateTimeRangeDto {
  @IsNotEmpty()
  @IsDateString()
  start: string;

  @IsNotEmpty()
  @IsDateString()
  end: string;
}

export class ActivityCapacityDto {
  @IsNumber()
  @IsOptional()
  min?: number;

  @IsNumber()
  @IsOptional()
  max?: number;

  @IsNumber()
  @IsOptional()
  current?: number;
}

export class ActivitySettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => DateTimeRangeDto)
  registrationPeriod?: DateTimeRangeDto;
  
  @IsOptional()
  @ValidateNested()
  @Type(() => DateTimeRangeDto)
  activityPeriod?: DateTimeRangeDto;
  
  @IsOptional()
  @ValidateNested()
  @Type(() => ActivityCapacityDto)
  capacity?: ActivityCapacityDto;
  
  @IsOptional()
  @IsBoolean()
  isRegistrationRequired?: boolean;
  
  @IsOptional()
  @IsBoolean()
  isAttendanceRequired?: boolean;
  
  @IsOptional()
  @IsObject()
  customSettings?: Record<string, any>;
}

// Default create activite dto
export class CreateActiviteDto {
    // Name of activity (Localization)
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => Localization)
    name: Localization;

    // Full Details of activity (Localization)
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => Localization)
    fullDetails: Localization;

    // Short Details of activity (Localization)
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => Localization)
    shortDetails: Localization;

    // Photos of activity
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => Photo)
    photos: Photo;

    // Type of activity
    @IsNotEmpty()
    @IsString()
    type: string;

    // Icon of activity
    @IsOptional()
    @IsString()
    icon?: string;

    // Is open of activity
    @IsOptional()
    @IsBoolean()
    isOpen?: boolean;

    // Is in progress of activity
    @IsOptional()
    @IsBoolean()
    isInProgress?: boolean;

    // Is visible of activity
    @IsOptional()
    @IsBoolean()
    isVisible?: boolean;
    
    // Activity location
    @IsOptional()
    @IsString()
    location?: string;
    
    // Activity tags for filtering and categorization
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];
    
    // Activity settings
    @IsOptional()
    @ValidateNested()
    @Type(() => ActivitySettingsDto)
    settings?: ActivitySettingsDto;
    
    // Related organizations or departments
    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    organizations?: string[] | Types.ObjectId[];
    
    // Activity creator
    @IsOptional()
    @IsMongoId()
    createdBy?: string | Types.ObjectId;
    
    // Custom fields for flexibility
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}