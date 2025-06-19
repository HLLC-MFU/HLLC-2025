import { IsMongoId, IsNotEmpty, IsObject, IsOptional, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class DynamicObject {
    [key: string]: string;
}

export class CreateInterfacesDto {
    @IsMongoId()
    @IsNotEmpty()
    school: string;

    @IsObject()
    @IsOptional()
    @ValidateNested()
    @Type(() => DynamicObject)
    assets?: Record<string, string>;
}
