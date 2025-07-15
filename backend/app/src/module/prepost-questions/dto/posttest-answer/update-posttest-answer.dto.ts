import { PartialType } from '@nestjs/mapped-types';
import { CreatePosttestAnswerDto } from './create-posttest-answer.dto';

export class UpdatePosttestAnswerDto extends PartialType(
  CreatePosttestAnswerDto,
) {}
