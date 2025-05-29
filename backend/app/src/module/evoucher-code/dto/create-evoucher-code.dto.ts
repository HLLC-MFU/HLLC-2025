import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

export class CreateEvoucherCodeDto {

    @IsString()
    @IsNotEmpty()
    code: string;

    @IsBoolean()
    @IsOptional()
    isUsed?: boolean;

    @IsObject()
    @IsNotEmpty()
    metadata: {
        user?: string;
        evoucher: string;
    };
}
