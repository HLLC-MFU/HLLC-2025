import { IsMongoId, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

import { Localization, Photo } from "src/pkg/types/common";
export class CreateSponsorDto {

    @IsNotEmpty()
    @IsString()
    name: Localization;

    @IsNotEmpty()
    @IsObject()
    photo: Photo;

    @IsNotEmpty()
    @IsMongoId()
    type: string;

    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;
}
