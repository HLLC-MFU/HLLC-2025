export type Activity = {
    _id: string;
    name: ILanguage;
    shortDetails: ILanguage;
    fullDetails: ILanguage;
    location: ILanguage;
    metadata: {
        isOpen: boolean;
        isProgressCount: boolean;
        isVisible: boolean;
    };
    acronym: string;
    type: string;
    photo: {
        bannerPhoto: string;
    };
    createdAt: string;
    updatedAt: string;
    __v: number;
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
