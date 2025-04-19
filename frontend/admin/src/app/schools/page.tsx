'use client'

import { getSchools } from "@/api/schoolApi";
import SchoolAccordion from "@/components/Accordions/SchoolAccordion";
import { Schools } from "@/types/schools";
import { Button, Card } from "@heroui/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SchoolsPage() {
    const [schools, setSchools] = useState<Schools[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();

    useEffect(() => {
        const fetchSchools = async () => {
            try {
                const response = await getSchools();
                setSchools(response.data);
            } catch (err) {
                setError("Failed to fetch schools");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSchools();
    }, []);

    const handleDetail = (schoolId: number) => {
        router.push(`/schools/${schoolId}`);
    };

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Schools</h1>
                <Button color="primary">Add School</Button>
            </div>

            {loading ? (
                <div className="w-full flex justify-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
            ) : error ? (
                <div className="w-full p-4 bg-red-50 text-red-500 rounded-lg">
                    {error}
                </div>
            ) : (
                <Card className="w-full p-4 bg-white shadow-md rounded-lg border border-gray-200">
                    <div className="flex flex-col gap-4">
                        {schools.map((school) => (
                            <SchoolAccordion key={school.id} school={school} onDetail={handleDetail} />
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
