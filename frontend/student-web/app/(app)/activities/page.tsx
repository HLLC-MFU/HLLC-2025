'use client';
import { useMemo, useState } from 'react';

import ActivitiesList from './_components/ActivitiesList';
import { ActivitiesFilters } from './_components/ActivitiesFilters';
import UpcomingCard from './_components/UpcomingCard';

import { useActivities } from '@/hooks/useActivities';

export default function ActivitiesPage() {
  const { activities, loading } = useActivities(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
    <div className="flex-col min-h-screen">
      <div className="sticky top-0 z-20 mb-5 bg-white/5 backdrop-blur dark:bg-black/30 rounded-lg flex flex-col gap-5">
        <h1 className="text-2xl font-bold">Activities</h1>
        <ActivitiesFilters
          searchQuery={searchQuery}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSearchQueryChange={setSearchQuery}
          onSortByChange={setSortBy}
          onSortDirectionToggle={toggleSortDirection}
        />
        {/* Upcoming Activities */}
        <div>
          {upcomingActivity && <UpcomingCard activity={upcomingActivity} />}
        </div>
        <h1 className="p-1 ml-2">
          <span className="text-xl font-semibold">All Activities</span>
          {filteredAndSortedActivities.length > 0 && (
            <span className="text-sm text-default-500 ml-2">
              ({filteredAndSortedActivities.length} found)
            </span>
          )}
        </h1>
      </div>
      <ActivitiesList
        activities={filteredAndSortedActivities}
        isLoading={loading}
      />

      {filteredAndSortedActivities?.length === 0 && !loading && (
        <p className="text-center text-sm text-default-500">
          No activities found.
        </p>
      )}
    </div>
  );
}
