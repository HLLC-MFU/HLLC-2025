import {
  ArrayNotEmpty,
  IsArray,
  IsString,
} from 'class-validator';

export class KhantokDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  username: string[];
}
