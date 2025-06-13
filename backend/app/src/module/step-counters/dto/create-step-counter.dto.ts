import { IsMongoId, IsNotEmpty, IsNumber } from "class-validator";

export class CreateStepCounterDto {
    @IsMongoId()
    @IsNotEmpty()
    user: string;

    @IsNotEmpty()
    @IsNumber()
    stepCount: number;
}
