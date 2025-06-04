import { PartialType } from '@nestjs/swagger';
import { CreateActivitiesTypeDto } from './create-activities-type.dto';

export class UpdateActivitiesTypeDto extends PartialType(CreateActivitiesTypeDto) {}
