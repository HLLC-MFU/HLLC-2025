import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MetadataDto {
  @IsString()
  @IsNotEmpty()
  secret: string;
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword: string;

  @ValidateNested()
  @Type(() => MetadataDto)
  metadata: MetadataDto;
}
