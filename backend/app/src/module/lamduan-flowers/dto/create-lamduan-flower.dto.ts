import { IsMongoId, IsNotEmpty, IsObject } from "class-validator";
import { Localization, Photo } from "src/pkg/types/common";

export class CreateLamduanFlowerDto {

    @IsMongoId()
    @IsNotEmpty()
    user: string;

    @IsMongoId()
    @IsNotEmpty()
    comment: Localization

    @IsObject()
    @IsNotEmpty()
    photo: Photo;

}
