import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { PrepostQuestionTypes } from '../../enum/prepost-question-types.enum';
import { PrepostTypes } from '../../enum/posttest-types.enum';

export class CreatePrepostQuestiontDto {
  @IsEnum(PrepostQuestionTypes)
  @IsNotEmpty()
  displayType: PrepostQuestionTypes;

  @IsEnum(PrepostTypes)
  @IsNotEmpty()
  type: PrepostTypes;

  @IsString()
  @IsNotEmpty()
  question: string;

  @IsNumber()
  @IsNotEmpty()
  order: number;
}
