import { User } from "./lamduan-user";
import { Lang } from "./lang"

export type LamduanFlowers = {

    _id: string;
    user: User
    comment: Lang;
    photo: string;
    createdAt: string;

}
