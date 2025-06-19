import { PartialType } from '@nestjs/swagger';
import { CreateActivitiesDto } from './create-activities.dto';

export class UpdateActivityDto extends PartialType(CreateActivitiesDto) {}
