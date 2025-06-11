import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { AssessmentTypes } from "../enum/assessmentTypes.enum";

export class CreateAssessmentDto {

    @IsString()
    @IsNotEmpty()
    question: string;

    @IsEnum(AssessmentTypes)
    @IsNotEmpty()
    type: AssessmentTypes;

    @IsMongoId()
    @IsNotEmpty()
    activity: string;

    @IsNumber()
    @IsOptional()
    order: number;

    @IsOptional()
    @IsNotEmpty()
    banner: string;
}
