import { useState, useEffect } from 'react';
import { useRoles } from './useRoles';
import { useSchools } from './useSchool';
import { Role } from '@/types/user';
import { School } from '@/types/school';

export interface FilterData {
    userTypes: string[];
    schools: string[];
    majors: string[];
}

export function useFilterData() {
    const { roles, loading: rolesLoading } = useRoles();
    const { schools, loading: schoolsLoading } = useSchools();
    const [filterData, setFilterData] = useState<FilterData>({
        userTypes: ["All"],
        schools: ["All"],
        majors: ["All"]
    });

    useEffect(() => {
        if (!rolesLoading && !schoolsLoading) {
            // Transform roles into user types, adding "All" as first option
            const userTypes = ["All", ...roles
                .filter((role: Role): role is Role & { name: string } => typeof role.name === 'string')
                .map(role => role.name)
            ];

            // Transform schools and their majors, adding "All" as first option
            const schoolsList = ["All", ...schools
                .filter((school: School): school is School & { name: { en: string } } =>
                    typeof school.name?.en === 'string'
                )
                .map(school => school.name.en)
            ];

            const majorsList = ["All", ...schools
                .flatMap((school: School) =>
                    (school.majors || [])
                        .filter(major => typeof major.name?.en === 'string')
                        .map(major => major.name.en)
                )
            ];

            setFilterData({
                userTypes,
                schools: schoolsList,
                majors: majorsList
            });
        }
    }, [roles, schools, rolesLoading, schoolsLoading]);

    return {
        filterData,
        loading: rolesLoading || schoolsLoading
    };
}