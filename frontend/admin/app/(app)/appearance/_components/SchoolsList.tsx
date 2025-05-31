import { School } from "@/types/school";
import { useRouter } from "next/navigation";
import { SchoolCard } from "./SchoolCard";

interface SchoolListProps {
    schools: School[];
    isLoading: boolean;
}

export function SchoolList({ schools, isLoading }: SchoolListProps) {
    const router = useRouter();

    if (isLoading) return <p>Loading...</p>;

    if (!schools.length) return <p>No schools found.</p>;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {schools?.map((school, index) => (
                <SchoolCard
                    key={school._id ?? `school-${index}`}
                    school={school}
                />
            ))}

        </div>
    );
}
