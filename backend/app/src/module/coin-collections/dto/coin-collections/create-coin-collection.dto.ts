import { IsMongoId, IsNumber } from 'class-validator';

export class CreateCoinCollectionDto {
  @IsMongoId()
  user: string;

  @IsMongoId()
  landmark: string;

  @IsNumber()
  userLat: number;

  @IsNumber()
  userLong: number;
}
