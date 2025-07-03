import { useState, useEffect } from 'react';
import { useRoles } from './useRoles';
import { useSchools } from './useSchool';
import { Role } from '@/types/role';
import { School } from '@/types/school';
import { useActivities } from './useActivities';

export interface FilterData {
    userTypes: string[];
    activityTypes: string[];
    schools: string[];
    majors: string[];
}

export function useFilterData() {
    const { roles, loading: rolesLoading } = useRoles();
    const { activities, loading:activityLoading } = useActivities();
    const { schools, loading: schoolsLoading } = useSchools();
    const [filterData, setFilterData] = useState<FilterData>({
        activityTypes: ['All'],
        userTypes: ["All"],
        schools: ["All"],
        majors: ["All"]
    });

    useEffect(() => {
        if (!rolesLoading && !schoolsLoading && !activityLoading) {
            // Transform roles into user types, adding "All" as first option
            const userTypes = ["All", ...roles
                .filter((role: Role): role is Role & { name: string } => typeof role.name === 'string')
                .map(role => role.name)
            ];

            const activityTypes = ["All",...activities
                .filter((activity): activity is typeof activity & { name: { en: string } } => typeof activity.name?.en === 'string' )
                .map(activity => activity.name.en)
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
                activityTypes,
                userTypes,
                schools: schoolsList,
                majors: majorsList
            });
        }
    }, [roles, activities , schools, rolesLoading, schoolsLoading]);

    return {
        filterData,
        loading: rolesLoading || schoolsLoading || activityLoading
    };
}