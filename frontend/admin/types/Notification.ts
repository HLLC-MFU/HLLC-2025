import { Lang } from './lang'

export type Target = {
    type: 'school' | 'major' | 'individual';
    id: string[]
}

export type Notification = {
    _id: string
    title: Lang
    subtitle: Lang
    body: Lang
    icon: string
    image?: string
    redirectButton? : {
        label: Lang
        url: string
    }
    scope: 'global' | Target[]
}