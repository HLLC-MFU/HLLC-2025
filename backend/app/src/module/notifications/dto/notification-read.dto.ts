import { IsMongoId, IsNotEmpty } from 'class-validator';

export class ReadNotificationDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsMongoId()
  @IsNotEmpty()
  notificationId: string;
}
