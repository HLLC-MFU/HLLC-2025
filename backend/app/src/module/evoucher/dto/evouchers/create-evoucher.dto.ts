import { IsBoolean, IsDate, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from "class-validator";
import { Localization, Photo } from "src/pkg/types/common";
import { EvoucherType } from "../../schema/evoucher.schema";
import { Type } from "class-transformer";

export class CreateEvoucherDto {

    @IsNumber()
    @IsNotEmpty()
    @Type(() => Number)
    discount: number;

    @IsString()
    @IsNotEmpty()
    acronym: string;

    @IsEnum(EvoucherType)
    @IsNotEmpty()
    type: EvoucherType;

    @IsMongoId()
    @IsNotEmpty()
    sponsors: string;

    @IsDate()
    @IsNotEmpty()
    @Type(() => Date)
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
    metadata?: Record<string, string>;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    maxClaims?: number;

}