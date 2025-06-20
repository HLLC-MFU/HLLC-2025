"use client";

import { useMemo } from "react";
import { Card, CardBody, Spinner, Button } from "@heroui/react";
import { useFilterReducer } from "@/hooks/useFilterReducer";
import { useFilterData } from "@/hooks/useFilterData";
import { useActivityData } from "./hooks/useActivityData";
import { exportToCSV } from "./utils/export-utils";
import { FilterSection } from "./filter-section";
import { StatisticsCards } from "./statistics-cards";
import { QuestionSummary } from "./question-summary";
import { CustomStudentDetailsTable } from "./custom-student-details-table";
import { ExtendedStudentDetail } from "./types/activity-dashboard.types";

function LoadingState() {
    return (
        <div className="flex justify-center items-center h-screen">
            <Spinner size="lg" />
        </div>
    );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-screen space-y-4">
            <div className="text-red-500 text-lg">Error loading activity data</div>
            <div className="text-gray-500">{error}</div>
            <Button color="primary" variant="flat" onPress={onRetry}>
                Retry
            </Button>
        </div>
    );
}

function EmptyState({ hasActiveFilters }: { hasActiveFilters: boolean }) {
    return (
        <Card>
            <CardBody className="text-center py-8">
                <div className="text-gray-500">No student data available</div>
                <div className="text-gray-400 mt-2">
                    {hasActiveFilters ? "Try adjusting your filters" : "No students have started any activities yet"}
                </div>
            </CardBody>
        </Card>
    );
}

export default function ActivityDashboard() {
    const { filterState, handleFilterChange, handlePageChange, handleResetFilters } = useFilterReducer();
    const { filterData, loading: filterLoading } = useFilterData();
    const { loading, error, studentDetails, questionStats } = useActivityData();

    console.log("questionStats" ,questionStats )
    console.log("studentDetails" ,studentDetails )
    
    const filteredStudentDetails = useMemo(() => {
        const { userType, school, major, searchQuery } = filterState;
        const searchLower = searchQuery.toLowerCase();

        return studentDetails.filter(student => {
            if (userType !== "All" && student.userType !== userType) return false;
            if (school !== "All" && student.school !== school) return false;
            if (major !== "All" && student.major !== major) return false;
            if (searchQuery) {
                return student.name.toLowerCase().includes(searchLower) ||
                       student.userId.toLowerCase().includes(searchLower);
            }
            return true;
        });
    }, [studentDetails, filterState]);

    const hasActiveFilters = filterState.userType !== "All" || 
                           filterState.school !== "All" || 
                           filterState.major !== "All" || 
                           filterState.searchQuery !== "";

    if (loading || filterLoading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState error={error} onRetry={() => window.location.reload()} />;
    }

    return (
        <div className="space-y-6">
            <FilterSection
                userType={filterState.userType}
                school={filterState.school}
                major={filterState.major}
                searchQuery={filterState.searchQuery}
                onUserTypeChange={(value) => handleFilterChange('userType', value)}
                onSchoolChange={(value) => handleFilterChange('school', value)}
                onMajorChange={(value) => handleFilterChange('major', value)}
                onSearchChange={(value) => handleFilterChange('searchQuery', value)}
                onReset={handleResetFilters}
                filterData={filterData}
            />

            <StatisticsCards type="activity" />
            
            {questionStats.length > 0 && (
                <QuestionSummary questions={questionStats} />
            )}

            {filteredStudentDetails.length > 0 ? (
                <CustomStudentDetailsTable
                    students={filteredStudentDetails}
                    filteredCount={filteredStudentDetails.length}
                    page={filterState.page}
                    rowsPerPage={10}
                    onPageChange={handlePageChange}
                    onExportCSV={() => exportToCSV(filteredStudentDetails)}
                    searchQuery={filterState.searchQuery}
                    userType={filterState.userType}
                    school={filterState.school}
                    major={filterState.major}
                />
            ) : (
                <EmptyState hasActiveFilters={hasActiveFilters} />
            )}
        </div>
    );
} 