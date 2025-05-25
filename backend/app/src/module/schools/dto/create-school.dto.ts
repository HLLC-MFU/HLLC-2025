import { Localization, Photo } from 'src/pkg/types/common';

export class CreateSchoolDto {
  name: Localization;

  acronym: string;

  detail: Localization;

  photo: Photo;

  role: string;

  major: string;

  createdAt: Date;
}
