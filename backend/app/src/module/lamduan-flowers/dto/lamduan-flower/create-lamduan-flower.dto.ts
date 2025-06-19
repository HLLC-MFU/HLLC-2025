import { IsMongoId, IsNotEmpty, IsObject, IsString } from "class-validator";
import { Photo } from "src/pkg/types/common";

export class CreateLamduanFlowerDto {

    @IsMongoId()
    @IsNotEmpty()
    user: string;

    @IsString()
    @IsNotEmpty()
    comment: string;

    @IsObject()
    @IsNotEmpty()
    photo: Photo;

    @IsMongoId()
    @IsNotEmpty()
    setting: string;

}
