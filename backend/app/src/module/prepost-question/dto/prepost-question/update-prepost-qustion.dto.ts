import { PartialType } from '@nestjs/mapped-types';
import { CreatePrepostQuestiontDto } from './create-prepost-question.dto';

export class UpdatePrepostQuestiontDto extends PartialType(CreatePrepostQuestiontDto) {
    updatedAt: Date;
}
