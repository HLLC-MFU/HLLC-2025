import { Lang } from './lang'

export type Student = {
    _id: string;
    name: {
        first: string;
        middle?: string; // ใส่ ? ถ้า middle อาจไม่มี
        last: string;
    };
    username: string;
    metadata: {
        major: string;
    };
}

type Target = {
    type: 'school' | 'major' | 'individual';
    id: string[]
}

export type Notification = {
    title: Lang
    subtitle: Lang
    body: Lang
    icon: string
    image: string
    redirectButton? : {
        label: Lang
        url: string
    }
    scope: 'global' | Target[]
}