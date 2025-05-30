import { IsMongoId, IsNotEmpty, IsObject, IsOptional } from "class-validator";

export class CreateAppearanceDto {
    @IsMongoId()
    @IsNotEmpty()
    school: string;

    @IsObject()
    @IsOptional()
    colors: Record<string, string>;

    @IsObject()
    @IsOptional()
    assets: Record<string, string>;
}
