import { IsArray, IsMongoId, IsNotEmpty, IsOptional } from "class-validator";

export class CreateCoinCollectionDto {
    @IsNotEmpty()
    @IsMongoId()
    user: string;

    @IsOptional()
    @IsArray()
    @IsMongoId()
    landmark: string[];
}
