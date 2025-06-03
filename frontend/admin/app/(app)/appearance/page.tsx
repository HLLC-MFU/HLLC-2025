"use client";
import { useMemo, useState } from "react";

import { SchoolFilters } from "./_components/SchoolFilters";
import { SchoolList } from "./_components/SchoolsList";
import { useSchools } from "@/hooks/useSchool";



export default function AppearancesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<string>("name");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const { schools, loading } = useSchools();

    const filteredAndSortedSchools = useMemo(() => {
        if (!schools) return [];

        let filtered = schools;
        if (searchQuery.trim() !== "") {
            const lower = searchQuery.toLowerCase();
            filtered = schools.filter(
                (s) =>
                    s?.name?.en?.toLowerCase().includes(lower) ||
                    s?.name?.th?.toLowerCase().includes(lower) ||
                    s?.acronym?.toLowerCase().includes(lower)
            );
        }

        return filtered.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case "name": {
                    const nameA = a?.name?.en ?? "";
                    const nameB = b?.name?.en ?? "";
                    comparison = nameA.localeCompare(nameB);
                    break;
                }
                case "acronym": {
                    const acronymA = a?.acronym ?? "";
                    const acronymB = b?.acronym ?? "";
                    comparison = acronymA.localeCompare(acronymB);
                    break;
                }
            }
            return sortDirection === "asc" ? comparison : -comparison;
        });
    }, [schools, searchQuery, sortBy, sortDirection]);


    const toggleSortDirection = () => {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    };
    return (

        <div className="flex flex-col min-h-screen">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">Schools & Majors Management</h1>
                </div>
                <div className="flex flex-col gap-6">
                    <SchoolFilters
                        searchQuery={searchQuery}
                        onSearchQueryChange={setSearchQuery}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSortByChange={setSortBy}
                        onSortDirectionToggle={toggleSortDirection}
                    />
                    {schools?.length === 0 && !loading && (
                        <p className="text-center text-sm text-default-500">
                            No schools found. Please add a new school.
                        </p>
                    )}
                    <SchoolList
                        schools={filteredAndSortedSchools}
                        isLoading={loading}
                    />
                </div>
            </div>
        </div>
    );
}
