import { Appearance } from "@/types/appearance";
import { useRouter } from "next/navigation";

interface AppearanceListProps {
    appearances: Appearance[];
    isLoading: boolean;
}

export function AppearanceList({ appearances, isLoading }: AppearanceListProps) {
    const router = useRouter();

    if (isLoading) return <p>Loading...</p>;

    if (!appearances.length) return <p>No appearances found.</p>;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {appearances.map((appearance) => (
                <div
                    key={appearance._id}
                    className="border p-4 rounded-lg shadow cursor-pointer hover:bg-gray-100"
                    onClick={() => router.push(`/appearance/${appearance._id}`)}
                >
                    <h2 className="text-xl font-semibold">
                        {appearance.school?.name?.en ?? "Unnamed School"}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {appearance.school?.acronym ?? "No acronym"}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">ID: {appearance._id}</p>
                </div>
            ))}
        </div>
    );
}
