import { IsNotEmpty, IsNumber, IsObject, IsString } from "class-validator";
import { Localization, Location } from "src/pkg/types/common";

export class CreateLandmarkDto {
    @IsObject()
    @IsNotEmpty()
    name: Localization;

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
    coinAmount: number;

    @IsNotEmpty()
    @IsNumber()
    cooldown: number;
}   
