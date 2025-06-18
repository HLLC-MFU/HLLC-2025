import { IsArray, IsBoolean, IsMongoId, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

export class CreateEvoucherCodeDto {

    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty()
    user?: string[];

    @IsMongoId()
    @IsNotEmpty()
    evoucher: string;

    @IsBoolean()
    @IsOptional()
    isUsed?: boolean;

    @IsObject()
    @IsOptional()
    metadata?: Record<string, string>
}
