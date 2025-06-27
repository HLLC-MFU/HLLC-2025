import { IsMongoId, IsNumber } from 'class-validator';

export class CollectCoinDto {
  @IsMongoId()
  user: string;

  @IsMongoId()
  landmark: string;

  @IsNumber()
  userLat: number;

  @IsNumber()
  userLong: number;
}
