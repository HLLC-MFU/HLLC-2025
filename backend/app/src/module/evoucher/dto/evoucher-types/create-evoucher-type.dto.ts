import { IsBoolean, IsObject, IsOptional, IsString } from "class-validator";

import { IsNotEmpty } from "class-validator";

export class CreateEvoucherTypeDto {

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    key: string;

    @IsString()
    @IsOptional()
    description: string;

    @IsBoolean()
    @IsOptional()
    isClaimable?: boolean;
    
    @IsObject()
    @IsOptional()
    metadata?: Record<string, string>;
}
