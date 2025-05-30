"use client";
import { useMemo, useState } from "react";

import useAppearance from "@/hooks/useAppearance";
import { AppearanceList } from "./_components/AppearancesList";
import { AppearanceFilters } from "./_components/AppearanceFilters";


export default function AppearancesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<string>("name");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const { appearances, loading } = useAppearance();

    const filteredAndSortedSchools = useMemo(() => {
        if (!appearances) return [];

        let filtered = appearances;
        if (searchQuery.trim() !== "") {
            const lower = searchQuery.toLowerCase();
            filtered = appearances.filter(
                (s) =>
                    s.school?.name?.en?.toLowerCase().includes(lower) ||
                    s.school?.name?.th?.toLowerCase().includes(lower) ||
                    s.school?.acronym?.toLowerCase().includes(lower)
            );
        }

        return filtered.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case "name": {
                    const nameA = a.school?.name?.en ?? "";
                    const nameB = b.school?.name?.en ?? "";
                    comparison = nameA.localeCompare(nameB);
                    break;
                }
                case "acronym": {
                    const acronymA = a.school?.acronym ?? "";
                    const acronymB = b.school?.acronym ?? "";
                    comparison = acronymA.localeCompare(acronymB);
                    break;
                }
            }
            return sortDirection === "asc" ? comparison : -comparison;
        });
    }, [appearances, searchQuery, sortBy, sortDirection]);


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
                    <AppearanceFilters
                        searchQuery={searchQuery}
                        onSearchQueryChange={setSearchQuery}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSortByChange={setSortBy}
                        onSortDirectionToggle={toggleSortDirection}
                    />
                    {appearances?.length === 0 && !loading && (
                        <p className="text-center text-sm text-default-500">
                            No schools found. Please add a new school.
                        </p>
                    )}
                    <AppearanceList
                        appearances={filteredAndSortedSchools}
                        isLoading={loading}
                    />
                </div>
            </div>
        </div>
    );
}
