import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsObject, IsOptional } from "class-validator";
import { AssessmentTypes } from "../enum/assessmentTypes.enum";
import { Localization } from "src/pkg/types/common";

export class CreateAssessmentDto {

    @IsObject()
    @IsNotEmpty()
    question: Localization;

    @IsEnum(AssessmentTypes)
    @IsNotEmpty()
    type: AssessmentTypes;

    @IsMongoId()
    @IsNotEmpty()
    activity: string;

    @IsNumber()
    @IsOptional()
    order: number;
}
