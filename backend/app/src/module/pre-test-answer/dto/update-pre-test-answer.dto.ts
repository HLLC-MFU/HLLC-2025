import { PartialType } from '@nestjs/mapped-types';
import { CreatePreTestAnswerDto } from './create-pre-test-answer.dto';

export class UpdatePreTestAnswerDto extends PartialType(CreatePreTestAnswerDto) {
    updateAt= Date();
}
