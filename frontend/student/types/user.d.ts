interface IUser {
    id: string
    fullName: string
    username: string
    major: {
        id: string
        name: ILanguage
        acronym: string
        school: {
            id: string
            name: ILanguage
            acronym: string
        }
    }
    type: string
    round: string
    theme: {
        colors: Record<string, string>;
        assets: Record<string, string>;
    };
}