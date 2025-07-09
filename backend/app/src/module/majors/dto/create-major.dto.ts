import { IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

export class CreateMajorDto {
  name: {
    th: string;
    en: string;
  };

  acronym: string;

  detail: {
    th: string;
    en: string;
  };

  @IsMongoId()
  school: Types.ObjectId;

  createdAt: Date;
}
