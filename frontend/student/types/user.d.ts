type User = {
    _id: string;
    id: string;
    name: {
        first: ILanguage;
        last: ILanguage;
    };
    username: string;
    major: Major;
    type: string;
    round: string;
    pretest: number;
    posttest: number;
    theme: Theme;
    fullName: string;
};

type Major = {
    id: string;
    name: ILanguage;
    acronym: string;
    detail: ILanguage;
    school: School;
};

type School = {
    id: string;
    name: ILanguage;
    acronym: string;
    detail: ILanguage;
    photos: {
        first: string;
        second: string;
        third: string;
        fourth: string;
    };
};

type Theme = {
    id: string;
    school: string;
    colors: ThemeColors;
    assets: ThemeAssets;
};

type ThemeColors = {
    error: string;
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    "sidebar-bg": string;
    "sidebar-icon": string;
    "sidebar-icon-active": string;
    "sidebar-text": string;
    "sidebar-text-active": string;
    "bottom-bg": string;
    "bottom-center-bg": string;
    "bottom-center-icon": string;
    "bottom-icon": string;
    "bottom-icon-active": string;
    "bottom-text": string;
    "bottom-text-active": string;
    "card-bg": string;
    "card-surface": string;
    "dialog-surface": string;
    content: string;
    subtitle: string;
    title: string;
    "progress-horizontal-gradient-1": string;
    "progress-horizontal-gradient-2": string;
    "progress-horizontal-gradient-3": string;
    "progress-horizontal-gradient-4": string;
    "progress-horizontal-gradient-5": string;
    "progress-vertical-gradient-1": string;
    "progress-vertical-gradient-2": string;
    "progress-vertical-gradient-3": string;
    "progress-vertical-gradient-4": string;
    "progress-vertical-gradient-5": string;
    "progress-gradient-1": string;
    "progress-gradient-2": string;
    "progress-gradient-3": string;
    "progress-gradient-4": string;
    "progress-gradient-5": string;
    "evolution-card": string;
    "evolution-menu": string;
    "evolution-text-card": string;
    "evolution-text-menu": string;
};

type ThemeAssets = {
    background: string;
    backpack: string;
    contest: string;
    lamduan: string;
    community: string;
    username: string;
    studentId: string;
    school: string;
    major: string;
    question: string;
    khantoke: string;
};
