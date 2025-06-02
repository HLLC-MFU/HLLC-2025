import { status } from "../enum/status.enum"
import { IsDateString, IsNotEmpty, IsNumber, IsObject, IsOptional } from "class-validator";

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
    image: string;

    @IsOptional()
    status: status;

    @IsNotEmpty()
    @IsDateString()
    startAt: Date;

    @IsNotEmpty()
    @IsDateString()
    endAt: Date;
}
