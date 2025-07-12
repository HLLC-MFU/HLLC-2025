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

export type UserActivity = {
  _id: string
  name: {
    th: string
    en: string
  }
  acronym: string
  fullDetails: {
    th: string
    en: string
  }
  shortDetails: {
    th: string
    en: string
  }
  type: {
    _id: string
    name: string
  }
  photo: {
    logoPhoto: string
    bannerPhoto: string
  }
  location: {
    th: string
    en: string
    latitude: number
    longitude: number
    mapUrl: string
  }
  metadata: {
    isOpen: boolean
    checkinStartAt: string
    endAt: string
    startAt: string
  }
  createdAt: string
  updatedAt: string
  checkinStatus: number
  checkinMessage: string
  hasAnsweredAssessment: boolean
}
