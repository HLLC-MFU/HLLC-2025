import { PartialType } from '@nestjs/mapped-types';
import { CreateReportCategoryDto } from './create-report_category.dto';

export class UpdateReportCategoryDto extends PartialType(CreateReportCategoryDto) {}
