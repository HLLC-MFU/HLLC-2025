import { PartialType } from '@nestjs/swagger';
import { CreateActivitiesMajorDto } from './create-activities-major.dto';

export class UpdateActivitiesMajorDto extends PartialType(CreateActivitiesMajorDto) {}
