import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';

class MetadataDto {
  @IsString()
  @IsNotEmpty()
  secret: string;
}

export class ResetPasswordDto {
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
