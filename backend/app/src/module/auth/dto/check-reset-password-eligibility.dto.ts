// dto/check-reset-password-eligibility.dto.ts
import { IsString } from 'class-validator';

export class CheckResetPasswordEligibilityDto {
  @IsString()
  username: string;

  @IsString()
  secret: string;
}
