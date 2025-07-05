'use client'
import { useActivities } from "@/hooks/useActivities";
import ActivitiesList from "./_components/ActivitiesList";
import { ActivitiesFilters } from "./_components/ActivitiesFilters";
import { useMemo, useState } from "react";

export default function ActivitiesPage() {
    const { activities, loading } = useActivities();
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<string>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const filteredAndSortedActivities = useMemo(() => {
        if (!activities) return [];

        let filtered = activities;

        if (searchQuery.trim() !== '') {
            const lower = searchQuery.toLowerCase();

            filtered = activities.filter(
                (a) =>
                    a.name?.en?.toLowerCase().includes(lower) ||
                    a.name?.th?.toLowerCase().includes(lower) ||
                    a.acronym?.toLowerCase().includes(lower),
            );
        }

        return filtered.sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'name':
                    comparison = (a.name?.en ?? '').localeCompare(b.name?.en ?? '');
                    break;
                case 'acronym':
                    comparison = (a.acronym ?? '').localeCompare(b.acronym ?? '');
                    break;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [activities, searchQuery, sortBy, sortDirection]);

    const toggleSortDirection = () => {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    };

    return (
        <div className="flex-col min-h-screen">
            <div className="sticky top-0 z-20 mb-5 bg-white/5 backdrop-blur dark:bg-black/30 rounded-lg">
                <h1 className="text-xl font-bold mb-2">Activities</h1>
                <ActivitiesFilters
                    searchQuery={searchQuery}
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    onSearchQueryChange={setSearchQuery}
                    onSortByChange={setSortBy}
                    onSortDirectionToggle={toggleSortDirection}
                />
            </div>

            <ActivitiesList
                isLoading={loading}
                activities={filteredAndSortedActivities}
            />

            {filteredAndSortedActivities?.length === 0 && !loading && (
                <p className="text-center text-sm text-default-500">
                    No activities found.
                </p>
            )}
        </div>
    )
}