import { IsMongoId, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateCoinCollectionDto {
  @IsMongoId()
  @IsNotEmpty()
  user: string;

  @IsMongoId()
  @IsNotEmpty()
  landmark: string;

  @IsNumber()
  @IsNotEmpty()
  userLat: number;

  @IsNumber()
  @IsNotEmpty() 
  userLong: number;
}
