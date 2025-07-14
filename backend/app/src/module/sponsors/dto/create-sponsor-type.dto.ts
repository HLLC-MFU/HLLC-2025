import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateSponsorTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  priority: number;
}
