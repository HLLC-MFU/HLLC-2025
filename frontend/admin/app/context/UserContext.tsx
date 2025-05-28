"use client";

import React from 'react';

interface NameType {
    first: string;
    middle: string | null;
    last: string;
}

interface SchoolMajorType {
    name: {
        en: string;
        th: string;
    };
    _id: string;
}

interface MetadataType {
    phone: string;
    address: string;
    email: string;
    birthdate: Date;
    school: SchoolMajorType;
    major: SchoolMajorType | null;
}

export interface UserType {
    _id: string;
    username: string;
    name: NameType;
    role: string;
    metadata: MetadataType;
    createdAt: string;
    updatedAt: string;
}

const UserContext = React.createContext<UserType[] | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [users, setUsers] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            const res = await fetch("http://localhost:8080/api/users", {
                credentials: 'include'
            });

            if (res.ok) {
                const data = await res.json();
                setUsers(data.data);
            } else {
                console.error('Failed to fetch user:', res.status);
                setUsers(null);
            }

            setLoading(false);
        };

        fetchData();
    }, []);

    // Loading page
    if (loading) return <div>Loading Informations</div>;

    return (
        <UserContext.Provider value={users}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return React.useContext(UserContext);
}
