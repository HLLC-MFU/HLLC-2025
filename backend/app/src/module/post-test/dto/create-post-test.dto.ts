import {  IsEnum, IsNotEmpty, IsNumber, IsOptional,  IsString } from "class-validator";
import { PosttestTypes } from "../enum/Post-testTypes.enum";

export class CreatePosttestDto {

  @IsEnum(PosttestTypes)
  @IsNotEmpty()
  type: PosttestTypes;

  @IsString()
  @IsNotEmpty()
  question: string;

  @IsNumber()
  @IsNotEmpty()
  order: number

  @IsOptional()
  @IsNotEmpty()
  banner: string;
}
