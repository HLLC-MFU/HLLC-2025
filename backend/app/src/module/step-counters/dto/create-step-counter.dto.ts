import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsDate, IsMongoId, IsNotEmpty, IsNumber, IsOptional, ValidateNested } from "class-validator";

class Step {
    @IsOptional()
    @IsNumber()
    totalStep: number

    @IsOptional()
    @IsDate()
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
    step: Step[];

    @IsNotEmpty()
    @IsMongoId()
    achievement: string

    @IsOptional()
    @IsBoolean()
    completeStatus: boolean
}
