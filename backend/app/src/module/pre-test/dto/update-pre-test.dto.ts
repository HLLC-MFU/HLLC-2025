import { PartialType } from '@nestjs/mapped-types';
import { CreatePreTestDto } from './create-pre-test.dto';

export class UpdatePreTestDto extends PartialType(CreatePreTestDto) {
    updatedAt: Date;
}
