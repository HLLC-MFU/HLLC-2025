export type Activity = {
    id: string;
    name: ILanguage;
    shortName: ILanguage;
    code: string;
    type: number;
    description: ILanguage;
    shortDesc: ILanguage;
    banner: string;
    icon: string;
    open: boolean;  
    progress: boolean;
    show: boolean;
    item: ActivityItem;
    checkInAt: string;
    takeAssessmentAt: string;
    location: ILanguage;
    datetime: {
        start: string;
        end: string;
    }
    status: {
        step: number
        message: string
    }
}

export type ActivityItem = {
    name: ILanguage;
    description: ILanguage;
    image: {
        hidden: string;
        visible: string;
    }
    _id: string;
}
