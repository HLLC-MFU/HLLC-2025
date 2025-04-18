'use client'

import { getSchools } from "@/api/schoolApi";
import SchoolsCard from "@/components/Cards/SchoolCard";
import { Schools } from "@/types/schools";
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

    const handleClickCard = (schoolId: string) => {
        console.log("Card clicked:", schoolId);
    };

    return (
        <div className="flex flex-col items-end justify-center min-h-screen px-4 py-8">
            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <SchoolsCard schools={schools} onClick={handleClickCard} />
            )}
        </div>
    );
}