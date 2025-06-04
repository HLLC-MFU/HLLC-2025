import { IsBoolean } from 'class-validator';

export class CreateSystemStatusDto {
  @IsBoolean()
  status: boolean;
}
