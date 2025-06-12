import {  IsEnum, IsNotEmpty, IsNumber, IsOptional,  IsString } from "class-validator";
import { PrepostQuestionTypes } from "../enum/prepost-question-typs.enum";
import { PrepostTypes } from "../enum/posttest-types.enum";


export class CreatePrepostQuestiontDto {

  @IsEnum(PrepostQuestionTypes)
  @IsNotEmpty()
  displaytype:PrepostQuestionTypes;

  @IsEnum(PrepostTypes)
  @IsNotEmpty()
  type: PrepostTypes;

  @IsString()
  @IsNotEmpty()
  question: string;

  @IsNumber()
  @IsNotEmpty()
  order: number

}
