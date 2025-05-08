import { Types } from "mongoose";

export class CreateMajorDto {
    name: {
        th: string
        en: string
    }

    acronym: string

    detail: {
        th: string
        en: string
    }

    school: Types.ObjectId | string

    createdAt: Date
}
