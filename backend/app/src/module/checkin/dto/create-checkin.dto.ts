import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCheckinDto {
  @IsNotEmpty()
  @IsString()
  user: string;

  @IsString()
  staff?: string;

  @IsNotEmpty()
  @IsString({ each: true })
  activities: string;
}
