import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSponsorTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  priority: string;
}
