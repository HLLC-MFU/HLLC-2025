'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import ActivityCard from './_components/ActivitiesCard';

import { useActivities } from '@/hooks/useActivities';

export default function ActivitiesPage() {
  const { activities, loading } = useActivities(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const router = useRouter();

  const filteredAndSortedActivities = useMemo(() => {
    if (!activities) return [];

    let filtered = activities;

    if (searchQuery.trim() !== '') {
      const lower = searchQuery.toLowerCase();

      filtered = activities.filter(
        a =>
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

  const upcomingActivity = useMemo(() => {
    if (!activities || activities.length === 0) return null;

    const now = new Date();
    const futureActivities = activities
      .filter(a => new Date(a.metadata?.startAt) > now)
      .sort(
        (a, b) =>
          new Date(a.metadata.startAt).getTime() -
          new Date(b.metadata.startAt).getTime(),
      );

    return futureActivities[0] ?? null;
  }, [activities]);

  const toggleSortDirection = () => {
    setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <div
      className="flex flex-col min-h-screen w-full overflow-y-auto pb-16 gap-6 bg-transparent px-8"
      style={{ WebkitOverflowScrolling: 'touch' }} // enables smooth momentum scrolling on iOS Safari
    >
      <div className="flex flex-col mt-36 gap-5">
        {/* <h1 className="text-3xl font-bold">Activities</h1> */}
        {/* 
        <ActivitiesFilters
          searchQuery={searchQuery}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSearchQueryChange={setSearchQuery}
          onSortByChange={setSortBy}
          onSortDirectionToggle={toggleSortDirection}
        /> */}

        {upcomingActivity && (
          <div>
            <ActivityCard
              activity={upcomingActivity}
              onClick={() => router.push(`/activities/${upcomingActivity._id}`)}
            />
          </div>
        )}
      </div>

      {/* Cards grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pointer-events-auto">
        {filteredAndSortedActivities.map(activity => (
          <ActivityCard
            key={activity._id}
            activity={activity}
            onClick={() => router.push(`/activities/${activity._id}`)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredAndSortedActivities?.length === 0 && !loading && (
        <p className="text-center text-sm text-default-500">
          No activities found.
        </p>
      )}
    </div>
  );
}
