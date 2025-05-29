import { IsArray, IsBoolean, IsString } from 'class-validator';

export class CreateSystemStatusDto {
  @IsBoolean()
  status: boolean;
}
