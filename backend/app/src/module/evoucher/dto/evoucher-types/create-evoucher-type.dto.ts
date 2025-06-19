import { IsString, IsNotEmpty } from 'class-validator';

export class CreateEvoucherTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
