import { IsEnum, IsNotEmpty, IsNumber, IsObject } from 'class-validator';
import { PrepostQuestionTypes } from '../../enum/prepost-question-types.enum';
import { PrepostTypes } from '../../enum/posttest-types.enum';
import { Localization } from 'src/pkg/types/common';

export class CreatePrepostQuestiontDto {
  @IsEnum(PrepostQuestionTypes)
  @IsNotEmpty()
  displayType: PrepostQuestionTypes;

  @IsEnum(PrepostTypes)
  @IsNotEmpty()
  type: PrepostTypes;

  @IsObject()
  @IsNotEmpty()
  question: Localization;

  @IsNumber()
  @IsNotEmpty()
  order: number;
}
