import { IsNotEmpty, IsObject } from 'class-validator';
import { Localization } from 'src/pkg/types/common';
export class CreateReportTypeDto {
  @IsObject()
  @IsNotEmpty()
  name: Localization;
}
