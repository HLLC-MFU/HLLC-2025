import { School } from "@/types/school";
import { useRouter } from "next/navigation";

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
            {schools.map((school) => (
                <div
                    key={school._id}
                    className="border p-4 rounded-lg shadow cursor-pointer hover:bg-gray-100"
                    onClick={() => router.push(`/appearance/${school._id}`)}
                >
                    <h2 className="text-xl font-semibold">
                        {school?.name?.en ?? "Unnamed School"}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {school?.acronym ?? "No acronym"}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">ID: {school._id}</p>
                </div>
            ))}
        </div>
    );
}
