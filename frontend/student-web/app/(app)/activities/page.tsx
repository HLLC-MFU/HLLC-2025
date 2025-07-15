'use client';
import { useMemo, useState } from 'react';
import { useActivities } from '@/hooks/useActivities';
import { Input } from '@heroui/react';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ActivityCard from './_components/ActivitiesCard';
import ActivityCardSkeleton from './_components/ActivityCardSkeleton';

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

    // Filter by search query first, same as filteredAndSortedActivities logic
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

    // Then filter to future activities only
    const futureActivities = filtered
      .filter(a => new Date(a.metadata?.startAt) > now)
      .sort(
        (a, b) =>
          new Date(a.metadata.startAt).getTime() -
          new Date(b.metadata.startAt).getTime(),
      );

    return futureActivities[0] ?? null;
  }, [activities, searchQuery]);

  return (
    <div
      className="flex flex-col min-h-screen w-full overflow-y-auto pb-16 gap-6 bg-transparent px-8"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Search Input */}
      <div className="mb-6">
        <Input
          aria-label="Search activities"
          className="w-full max-w-md "
          placeholder="Search activities..."
          radius="full"
          size="lg"
          startContent={<Search className="text-default-500" size={20} />}
          type="search"
          value={searchQuery}
          variant="faded"
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-5">
        {upcomingActivity && !loading && (
          <div>
            <ActivityCard
              activity={upcomingActivity}
              onClick={() => router.push(`/activities/${upcomingActivity._id}`)}
            />
          </div>
        )}
        {loading && <ActivityCardSkeleton />}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pointer-events-auto">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
            <ActivityCardSkeleton key={i} />
          ))
          : filteredAndSortedActivities.map(activity => (
            <ActivityCard
              key={activity._id}
              activity={activity}
              onClick={() => router.push(`/activities/${activity._id}`)}
            />
          ))}
      </div>

      {!loading && filteredAndSortedActivities?.length === 0 && (
        <p className="text-center text-sm text-default-500">
          No activities found.
        </p>
      )}

    </div>
  );
}
