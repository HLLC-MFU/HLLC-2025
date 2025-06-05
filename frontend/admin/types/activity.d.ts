import { lang } from "./lang";

export type Activity = {
  _id: string;
  fullName: Lang;
  shortName: Lang;
  fullDetails: Lang;
  shortDetails: Lang;
  type: string;
  photo: {
    thumb: string;
    full: string;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
};
