import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsDate, IsISO8601, IsMongoId, IsNotEmpty, IsNumber, IsOptional, ValidateNested } from "class-validator";

class Step {
    @IsOptional()
    @IsNumber()
    totalStep: number

    @IsOptional()
    @IsISO8601()
    @Type(() => Date)
    date: Date;

    @IsNotEmpty()
    @IsNumber()
    step: number
}
export class CreateStepCounterDto {
    @IsMongoId()
    @IsNotEmpty()
    user: string;

    @ValidateNested({ each: true })
    @Type(() => Step)
    steps?: Step[];

    @IsNotEmpty()
    @IsMongoId()
    achievement: string

    @IsOptional()
    @IsBoolean()
    completeStatus: boolean
}
