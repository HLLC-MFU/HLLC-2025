import { Lang } from "./lang"
import { Photo } from "./photo";

export type Sponsors = {
    _id: string;
    name: Lang;
    logo: Photo;
    type: Types.ObjectId;
    priority: number;
    color: {
        primary: string;
        secondary: string;
    };
}