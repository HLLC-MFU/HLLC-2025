

export type User = {
    _id: string;
    name: UserName;
    username: string;
    password: string;
    role: Role;
    major: string;
    metadata?: Metadata[];
};

export type UserName = {
    first: string;
    middle?: string;
    last: string;
};

export type Role = {
    _id: string;
    name?: string;
};

export type Metadata = {
    // phone: string;
    // address: string;
    // email: string;
    // birthdate: Date;
    // schoolId: string;
    // school: {
    //     name: Lang;
    //     _id: string;
    // };
    // majorId: string;
    major?: string;
}