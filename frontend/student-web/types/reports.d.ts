import { Lang } from "./lang"

export type ReportType = {
    _id: string
    name: Lang
}

export type Report = {
    reporter: string
    category: string
    message: string
}