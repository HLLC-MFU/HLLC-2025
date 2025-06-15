import { IsNotEmpty, IsObject } from "class-validator";
import { Localization, Location } from "src/pkg/types/common";

export class CreateLandmarkDto {
    @IsObject()
    @IsNotEmpty()
    name: Localization;

    @IsObject()
    @IsNotEmpty()
    hint: Localization;

    @IsObject()
    @IsNotEmpty()
    location: Location;
}   
