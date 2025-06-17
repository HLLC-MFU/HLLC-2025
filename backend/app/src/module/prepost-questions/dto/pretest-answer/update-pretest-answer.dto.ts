import { PartialType } from '@nestjs/mapped-types';
import { CreatePretestAnswerDto } from './create-pretest-answer.dto';

export class UpdatePretestAnswerDto extends PartialType(CreatePretestAnswerDto) {
}
