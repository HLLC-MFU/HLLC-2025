// dashboard file
import { useState, useEffect } from 'react';
import { useRoles } from './useRoles';
import { useSchools } from './useSchool';
import { Role } from '@/types/role';
import { School } from '@/types/school';
import { useActivities } from './useActivities';

// Update the interface to include 'school' for majors
export interface FilterData {
    userTypes: string[];
    activityTypes: string[];
    schools: string[];
    majors: { name: string; school: string }[]; // Modified to be an array of objects
}

export function useFilterData() {
    const { roles, loading: rolesLoading } = useRoles();
    const { activities, loading: activityLoading } = useActivities();
    const { schools, loading: schoolsLoading } = useSchools();
    const [filterData, setFilterData] = useState<FilterData>({
        activityTypes: ['All'],
        userTypes: ["All"],
        schools: ["All"],
        majors: [{ name: "All", school: "" }] // Initialize with "All" major
    });

    useEffect(() => {
        if (!rolesLoading && !schoolsLoading && !activityLoading) {
            const userTypes = ["All", ...roles
                .filter((role: Role): role is Role & { name: string } => typeof role.name === 'string')
                .map(role => role.name)
            ];

            const activityTypes = ["All", ...activities
                .filter((activity): activity is typeof activity & { name: { en: string } } => typeof activity.name?.en === 'string')
                .map(activity => activity.name.en)
            ];

            const schoolsList = ["All", ...schools
                .filter((school: School): school is School & { name: { en: string } } =>
                    typeof school.name?.en === 'string'
                )
                .map(school => school.name.en)
            ];

            // Transform majors to include their associated school name
            const majorsList = [
                { name: "All", school: "" }, // Add "All" option with an empty school
                ...schools.flatMap((school: School) =>
                    (school.majors || [])
                        .filter(major => typeof major.name?.en === 'string')
                        .map(major => ({
                            name: major.name.en,
                            school: school.name?.en || '' // Associate major with its school
                        }))
                )
            ];

            setFilterData({
                activityTypes,
                userTypes,
                schools: schoolsList,
                majors: majorsList
            });
        }
    }, [roles, activities, schools, rolesLoading, schoolsLoading]);

    return {
        filterData,
        loading: rolesLoading || schoolsLoading || activityLoading
    };
}