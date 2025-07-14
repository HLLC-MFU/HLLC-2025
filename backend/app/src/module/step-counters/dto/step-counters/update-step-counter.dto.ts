import { PartialType } from '@nestjs/swagger';
import { CreateStepCounterDto } from './create-step-counter.dto';

export class UpdateStepCounterDto extends PartialType(CreateStepCounterDto) {}
