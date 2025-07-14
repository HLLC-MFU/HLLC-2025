import { ActivitiesSkeleton } from './ActivitiesSkeleton';
import ActivitiesCard from './ActivitiesCard';

import { Activities } from '@/types/activities';

type ActivitiesListProps = {
  activities: Activities[];
  isLoading: boolean;
};

export default function ActivitiesList({
  activities,
  isLoading,
}: ActivitiesListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ActivitiesSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex w-full">
      {activities?.map((activity, index) => (
        <ActivitiesCard
          key={activity._id ?? `activity-${index}`}
          activity={activity}
        />
      ))}
    </div>
  );
}
