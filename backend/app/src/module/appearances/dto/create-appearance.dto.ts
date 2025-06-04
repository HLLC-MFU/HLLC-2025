import { IsMongoId, IsNotEmpty, IsObject, IsOptional, ValidateNested } from "class-validator";
import { Type } from 'class-transformer';

export class DynamicObject {
    [key: string]: string;
}

export class CreateAppearanceDto {
    @IsMongoId()
    @IsNotEmpty()
    school: string;

    @IsObject()
    @IsOptional()
    @ValidateNested()
    @Type(() => DynamicObject)
    colors?: Record<string, string>;

    @IsObject()
    @IsOptional()
    @ValidateNested()
    @Type(() => DynamicObject)
    assets?: Record<string, string>;
}