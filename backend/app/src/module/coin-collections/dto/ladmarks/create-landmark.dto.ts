import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from "class-validator";
import { Localization, Location, mapCoordinate } from "src/pkg/types/common";
import { LandmarkType } from "../../enum/landmark-types.enum";

export class CreateLandmarkDto {
    @IsObject()
    @IsNotEmpty()
    name: Localization;

    @IsNotEmpty()
    @IsNumber()
    order: number

    @IsNotEmpty()
    @IsString()
    coinImage: string

    @IsObject()
    @IsNotEmpty()
    hint: Localization;

    @IsNotEmpty()
    @IsString()
    hintImage: string;

    @IsObject()
    @IsNotEmpty()
    location: Location;

    @IsNotEmpty()
    @IsNumber()
    cooldown: number;

    @IsNumber()
    @IsOptional()
    limitDistance: number;

    @IsEnum(LandmarkType)
    @IsNotEmpty()
    type: LandmarkType;

    @IsObject()
    @IsNotEmpty()
    mapCoordinates: mapCoordinate
}   
