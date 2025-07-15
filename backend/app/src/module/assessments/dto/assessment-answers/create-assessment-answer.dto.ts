import { Type } from 'class-transformer';
import {
  IsMongoId,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateAssessmentAnswerDto {
  @IsNotEmpty()
  @IsMongoId()
  user: string;

  @ValidateNested({ each: true })
  @Type(() => Answer)
  answers: Answer[];
}

class Answer {
  @IsMongoId()
  assessment: string;

  @IsString()
  @IsNotEmpty()
  answer: string;
}
