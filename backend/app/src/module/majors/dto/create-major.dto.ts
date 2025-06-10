import { IsDate, IsMongoId, IsObject, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CreateMajorDto {
  @IsObject()
  name: {
    th: string;
    en: string;
  };

  @IsString()
  acronym: string;

  @IsObject()
  detail: {
    th: string;
    en: string;
  };

  @IsMongoId()
  school: Types.ObjectId;

  @IsDate()
  createdAt: Date;
}
