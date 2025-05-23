import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCheckinDto {
  @IsNotEmpty()
  @IsString()
  user: string;

  @IsNotEmpty()
  @IsString()
  staff: string;

  @IsNotEmpty()
  @IsString()
  activities: string;
}
