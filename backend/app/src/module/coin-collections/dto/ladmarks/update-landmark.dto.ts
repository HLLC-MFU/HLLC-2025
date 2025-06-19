import { PartialType } from '@nestjs/swagger';
import { CreateLandmarkDto } from './create-landmark.dto';

export class UpdateLandmarkDto extends PartialType(CreateLandmarkDto) {}
