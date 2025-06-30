import { Type } from "class-transformer";
import { IsDateString, IsMongoId, IsNotEmpty, IsNumber, ValidateNested } from "class-validator";

class Step {
    @IsNotEmpty()
    @IsNumber()
    step: number

    @IsDateString()
    date: Date;
}
export class CreateStepCounterDto {
    @IsMongoId()
    @IsNotEmpty()
    user: string;

    @ValidateNested({ each: true })
    @Type(() => Step)
    steps?: Step[];
}
