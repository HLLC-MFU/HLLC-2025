import { IsBoolean, IsDate, IsEmpty, IsMongoId, IsNumber, IsObject, IsOptional, IsString } from "class-validator";
import { Localization, Photo } from "src/pkg/types/common";

export class CreateEvoucherDto {

    @IsNumber()
    @IsEmpty()
    discount: number;

    @IsString()
    @IsEmpty()
    acronym: string;

    @IsMongoId()
    @IsEmpty()
    type: string;

    @IsMongoId()
    @IsEmpty()
    sponsors: string;

    @IsMongoId()
    @IsEmpty()
    campaign: string;

    @IsDate()
    @IsEmpty()
    expiration: Date;

    @IsObject()
    @IsEmpty()
    detail: Localization;

    @IsObject()
    @IsEmpty()
    photo: Photo;

    @IsBoolean()
    @IsEmpty()
    status: boolean;

    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;

}
