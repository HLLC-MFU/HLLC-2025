import { PartialType } from '@nestjs/mapped-types';
import { CreateReportTypeDto } from './create-type.dto';

export class UpdateReportTypeDto extends PartialType(CreateReportTypeDto) {}
