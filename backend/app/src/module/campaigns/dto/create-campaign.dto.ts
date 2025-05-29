import { Photo } from "src/pkg/types/common"
import { status } from "../enum/status.enum"
import { IsDate, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from "class-validator";

export class CreateCampaignDto {

    @IsNotEmpty()
    @IsObject()
    name: string;

    @IsNotEmpty()
    @IsObject()
    detail: string;

    @IsNotEmpty()
    @IsNumber()
    budget: number;

    @IsNotEmpty()
    @IsObject()
    image: Photo;

    @IsOptional()
    status: status;

    @IsNotEmpty()
    @IsDate()
    startAt: Date;

    @IsNotEmpty()
    @IsDate()
    endAt: Date;
}
