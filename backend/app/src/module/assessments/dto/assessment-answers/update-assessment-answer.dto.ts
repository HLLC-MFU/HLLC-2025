import { PartialType } from '@nestjs/swagger';
import { CreateAssessmentAnswerDto } from './create-assessment-answer.dto';

export class UpdateAssessmentAnswerDto extends PartialType(CreateAssessmentAnswerDto) {
    updatedAt: Date;
}
