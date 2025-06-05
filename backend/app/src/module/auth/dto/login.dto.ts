import { IsNotEmpty, IsString } from 'class-validator';

import { IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @IsString()
  @IsNotEmpty()
  username: string;
  
  @IsString()
  @IsNotEmpty()

  @IsString()
  @IsNotEmpty()
  password: string;
}
