import { IsNotEmpty, IsMongoId, IsString } from 'class-validator';

export class CreateReportDto {
  @IsMongoId()
  @IsNotEmpty()
  reporter: string;

  @IsMongoId()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  massage: string;

  @IsString()
  @IsNotEmpty()
  status: string;
}
