import { IsNotEmpty, IsObject } from 'class-validator';
import { Localization } from 'src/pkg/types/common';
export class CreateReportCategoryDto {
  @IsObject()
  @IsNotEmpty()
  name: Localization;
}
