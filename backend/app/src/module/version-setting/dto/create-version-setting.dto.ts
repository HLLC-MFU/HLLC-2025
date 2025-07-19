import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateVersionSettingDto {

    @IsString()
    @IsNotEmpty()
    appVersion: string;

    @IsNumber()
    @IsNotEmpty()
    buildNumber: number;
}
