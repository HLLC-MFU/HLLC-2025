import { IsMongoId, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateMapDto {
    @IsNotEmpty()
    map: string;

    @IsNotEmpty()
    @IsNumber()
    x: number;

    @IsNotEmpty()
    @IsNumber()
    y: number;

    @IsNotEmpty()
    @IsString()
    mapUrl: string;

    @IsNotEmpty()
    @IsMongoId()
    landmark: string
}
