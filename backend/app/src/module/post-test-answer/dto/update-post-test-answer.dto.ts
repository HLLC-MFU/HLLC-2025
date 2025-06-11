import { PartialType } from '@nestjs/mapped-types';
import { CreatePostTestAnswerDto } from './create-post-test-answer.dto';

export class UpdatePostTestAnswerDto extends PartialType(CreatePostTestAnswerDto) {
    updateAt: Date;
}
