import { School } from '@/types/school';
import { SchoolCard } from './SchoolCard';
import { SchoolSkeleton } from './SchoolSkeleton';
import { Appearance } from '@/types/appearance';

interface SchoolListProps {
  schools: School[];
  isLoading: boolean;
  fetchAppearancesById: (id: string) => Promise<{ data: Appearance[] } | null>;
  createAppearance: (appearanceFormData: FormData) => Promise<void>;
}

export function SchoolList({
  schools,
  isLoading,
  fetchAppearancesById,
  createAppearance,
}: SchoolListProps) {
  if (isLoading) return <SchoolSkeleton />;

  if (!schools.length) return <p>No schools found.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {schools?.map((school, index) => (
        <SchoolCard
          key={school._id ?? `school-${index}`}
          school={school}
          fetchAppearancesById={fetchAppearancesById}
          createAppearance={createAppearance}
        />
      ))}
    </div>
  );
}
