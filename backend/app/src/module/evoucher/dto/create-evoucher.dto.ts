import { IsBoolean, IsDate, IsMongoId, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from "class-validator";
import { Localization, Photo } from "src/pkg/types/common";

export class CreateEvoucherDto {

    @IsNumber()
    @IsNotEmpty()
    discount: number;

    @IsString()
    @IsNotEmpty()
    acronym: string;

    @IsMongoId()
    @IsNotEmpty()
    type: string;

    @IsMongoId()
    @IsNotEmpty()
    sponsors: string;

    @IsMongoId()
    @IsNotEmpty()
    campaign: string;

    @IsDate()
    @IsNotEmpty()
    expiration: Date;

    @IsObject()
    @IsNotEmpty()
    detail: Localization;

    @IsObject()
    @IsNotEmpty()
    photo: Photo;

    @IsBoolean()
    @IsOptional()
    status?: boolean;

    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;

}
