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
  message: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  createdAt: Date;
}
