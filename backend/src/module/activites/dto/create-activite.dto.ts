import { Type } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { Localization } from "src/pkg/types/localize";
import { Photo } from "src/pkg/types/photos";

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
}