import { Photo } from "src/pkg/types/common";

export class CreateSchoolDto {
  name: {
    th: string;
    en: string;
  };

  acronym: string;

  detail: {
    th: string;
    en: string;
  };

  photos: Photo;

  createdAt: Date;
}
