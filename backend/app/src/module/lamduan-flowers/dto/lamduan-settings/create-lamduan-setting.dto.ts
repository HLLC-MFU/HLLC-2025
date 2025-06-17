import { IsNotEmpty, IsObject, IsString, IsDateString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { Photo } from "src/pkg/types/common";

export class CreateLamduanSettingDto {

    @IsObject()
    @IsNotEmpty()
    TutorialPhoto: Photo;

    @IsString()
    @IsNotEmpty()
    TutorialVideo: string;

    @IsDateString()
    @IsNotEmpty()
    StartAt: string;

    @IsDateString()
    @IsNotEmpty()
    EndAt: string;
}
