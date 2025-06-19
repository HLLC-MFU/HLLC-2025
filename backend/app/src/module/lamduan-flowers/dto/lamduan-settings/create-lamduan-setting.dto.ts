import { IsNotEmpty, IsObject, IsString, IsDateString, ValidateNested } from "class-validator";
import { Photo } from "src/pkg/types/common";

export class CreateLamduanSettingDto {

    @IsObject()
    @IsNotEmpty()
    tutorialPhoto: Photo;

    @IsString()
    @IsNotEmpty()
    tutorialVideo: string;

    @IsDateString()
    @IsNotEmpty()
    startAt: string;

    @IsDateString()
    @IsNotEmpty()
    endAt: string;
}
