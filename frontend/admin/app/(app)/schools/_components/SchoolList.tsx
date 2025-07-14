import type { School } from "@/types/school";

import { SchoolCard } from "./SchoolCard";
import { SchoolSkeleton } from "./SchoolSkeleton";

interface SchoolListProps {
    schools?: School[];
    isLoading: boolean;
    onEditSchool: (school: School) => void;
    onDeleteSchool: (school: School) => void;
}

export function SchoolList({ schools, isLoading, onEditSchool, onDeleteSchool }: SchoolListProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <SchoolSkeleton key={i} />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
{schools?.map((school, index) => (
  <SchoolCard
    key={school._id ?? `school-${index}`}
    school={school}
    onDelete={onDeleteSchool}
    onEdit={onEditSchool}
  />
))}

        </div>
    );
} 