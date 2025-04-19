'use client'

import { getSchools } from "@/api/schoolApi";
import SchoolAccordion from "@/components/Accordions/SchoolAccordion";
import { Schools } from "@/types/schools";
import { Card } from "@heroui/react";
import { useEffect, useState } from "react";

export default function SchoolsPage() {
    const [schools, setSchools] = useState<Schools[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const handleClickCard = (schoolId: number) => {
        console.log("Card clicked:", schoolId);
    };

    return (
        <div className="flex flex-col items-start justify-center min-h-screen py-4">
            <h1 className="text-2xl font-bold mb-4 p-4">All Schools</h1>
            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
        
                    <Card className="flex max-w-screen p-2 bg-white shadow-md rounded-lg gap-1 border border-gray-300">
                        {schools.map((school) => (
                            <SchoolAccordion key={school.id} school={school} onDetail={handleClickCard} />
                        ))}
                    </Card>
            )}
        </div>
    );
}
