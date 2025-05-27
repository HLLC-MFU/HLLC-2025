import { ArrayNotEmpty, IsArray, IsMongoId, IsNotEmpty, isNotEmpty } from "class-validator";

export class MarkAsReadDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsMongoId()
  @IsNotEmpty()
  notificationId: string;
}

export class MarkAsUnreadDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  notificationIds: string[];
}
