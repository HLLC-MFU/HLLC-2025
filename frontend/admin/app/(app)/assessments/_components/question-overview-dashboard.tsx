"use client";

import { useEffect, useReducer, useMemo, useState, useCallback } from "react";
import { Spinner } from "@heroui/react";
import { 
    AssessmentType, 
    TestAnswer,
    AssessmentOverviewDashboardProps,
    Question,
    QuestionType,
    DisplayType,
    RawPretestAnswer,
    RawPosttestAnswer,
    APIResponse,
    UserInAnswer,
    TransformedAnswer
} from "@/types/assessment";
import { StatisticsCards } from "./statistics-cards";
import { FilterSection } from "./filter-section";
import { QuestionSummary } from "./question-summary";
import { ScoreDistributionChart } from "./score-distribution-chart";
// import { StudentDetailsTable } from "./student-details-table";
import { CustomStudentDetailsTable } from "./custom-student-details-table";
import {
    calculateAverageScore,
    calculateCompletionRate,
    calculateAverageTimeSpent,
    calculateScoreDistribution,
    calculateStudentDetails,
    calculateDifficultyDistribution,
    calculateQuestionTypeDistribution,
    transformRawAnswersToTestAnswers
} from "./utils/assessment-utils";
import { apiRequest } from "@/utils/api";
import { useFilterData } from "@/hooks/useFilterData";

// Types
type FilterState = {
    userType: string;
    school: string;
    major: string;
    searchQuery: string;
    page: number;
};

type FilterAction = 
    | { type: 'SET_FILTER'; field: keyof FilterState; value: string }
    | { type: 'SET_PAGE'; value: number }
    | { type: 'RESET_FILTERS' };

type QuestionSummaryResponse = {
    pretest?: {
        _id: string;
        displayType: string;
        type: string;
        question: {
            en: string;
            th: string;
        };
        order: number;
        createdAt: string;
        updatedAt: string;
    };
    posttest?: {
        _id: string;
        displayType: string;
        type: string;
        question: {
            en: string;
            th: string;
        };
        order: number;
        createdAt: string;
        updatedAt: string;
    };
    average: number;
    count: number;
};

// Constants
const initialFilterState: FilterState = {
    userType: "All",
    school: "All",
    major: "All",
    searchQuery: "",
    page: 1
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const ROWS_PER_PAGE = 10;

// Cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number }>();

async function fetchWithCache<T>(endpoint: string): Promise<APIResponse<T>> {
    const now = Date.now();
    const cached = apiCache.get(endpoint);
    
    if (cached && now - cached.timestamp < CACHE_DURATION) {
        return cached.data as APIResponse<T>;
    }

    try {
        const response = await apiRequest<T>(endpoint);
        if (!response?.data) {
            console.warn(`No data received from API endpoint: ${endpoint}`);
            return { 
                data: [] as unknown as T,
                meta: {
                    total: 0,
                    page: 1,
                    limit: 10,
                    totalPages: 0,
                    lastUpdatedAt: new Date().toISOString()
                },
                message: 'No data received'
            };
        }

        // Transform the API response to match the expected format
        const transformedResponse: APIResponse<T> = {
            data: response.data,
            meta: {
                total: Array.isArray(response.data) ? response.data.length : 1,
                page: 1,
                limit: Array.isArray(response.data) ? response.data.length : 1,
                totalPages: 1,
                lastUpdatedAt: new Date().toISOString()
            },
            message: response.message || 'Success'
        };

        apiCache.set(endpoint, { data: transformedResponse, timestamp: now });
        return transformedResponse;
    } catch (error) {
        console.error(`Error fetching from ${endpoint}:`, error);
        return { 
            data: [] as unknown as T,
            meta: {
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
                lastUpdatedAt: new Date().toISOString()
            },
            message: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// Add new types for API response
type ApiResponseWrapper<T> = {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        lastUpdatedAt: string;
    };
    message: string;
};

// Custom Hooks
function useFilterReducer() {
    const [state, dispatch] = useReducer(filterReducer, initialFilterState);

    const handleFilterChange = useCallback((field: keyof FilterState, value: string) => {
        dispatch({ type: 'SET_FILTER', field, value });
    }, []);

    const handlePageChange = useCallback((page: number) => {
        dispatch({ type: 'SET_PAGE', value: page });
    }, []);

    const handleResetFilters = useCallback(() => {
        dispatch({ type: 'RESET_FILTERS' });
    }, []);

    return {
        filterState: state,
        handleFilterChange,
        handlePageChange,
        handleResetFilters
    };
}

function useQuestionSummary(type: AssessmentType) {
    const [questionSummaryData, setQuestionSummaryData] = useState<QuestionSummaryResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuestionSummary = async () => {
            try {
                setLoading(true);
                const endpoint = type === 'pretest' 
                    ? '/pretest-answers/all/average'
                    : '/posttest-answers/all/average';
                
                const response = await fetchWithCache<QuestionSummaryResponse[]>(endpoint);
                setQuestionSummaryData(response.data || []);
            } catch (error) {
                console.error('Error fetching question summary:', error);
                setQuestionSummaryData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchQuestionSummary();
    }, [type]);

    return { questionSummaryData, loading };
}

function useAssessmentData() {
    const [pretestAnswers, setPretestAnswers] = useState<TransformedAnswer[]>([]);
    const [posttestAnswers, setPosttestAnswers] = useState<TransformedAnswer[]>([]);
    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [pretestRes, posttestRes, questionsRes] = await Promise.all([
                    fetchWithCache<ApiResponseWrapper<RawPretestAnswer>>('/pretest-answers'),
                    fetchWithCache<ApiResponseWrapper<RawPosttestAnswer>>('/posttest-answers'),
                    fetchWithCache<ApiResponseWrapper<Question>>('/prepost-questions')
                ]);

                const transformedPosttestAnswers = transformPosttestAnswers(posttestRes.data?.data || []);
                const transformedPretestAnswers = transformPretestAnswers(pretestRes.data?.data || []);

                setPretestAnswers(transformedPretestAnswers);
                setPosttestAnswers(transformedPosttestAnswers);
                setAllQuestions(questionsRes.data?.data || []);
            } catch (error) {
                console.error("Error fetching assessment data:", error);
                setPretestAnswers([]);
                setPosttestAnswers([]);
                setAllQuestions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { pretestAnswers, posttestAnswers, allQuestions, loading };
}

// Utility Functions
function filterReducer(state: FilterState, action: FilterAction): FilterState {
    switch (action.type) {
        case 'SET_FILTER':
            return {
                ...state,
                [action.field]: action.value,
                ...(action.field !== 'page' && { page: 1 })
            };
        case 'SET_PAGE':
            return { ...state, page: action.value };
        case 'RESET_FILTERS':
            return { ...initialFilterState, page: 1 };
        default:
            return state;
    }
}

function transformPosttestAnswers(answers: RawPosttestAnswer[]): TransformedAnswer[] {
    return answers.flatMap(answer => 
        answer.answers.map(ans => ({
            _id: answer._id,
            userId: answer.user._id,
            questionId: ans.posttest,
            answer: ans.answer,
            createdAt: answer.createdAt,
            updatedAt: answer.updatedAt,
            user: transformUserData(answer.user)
        }))
    );
}

function transformPretestAnswers(answers: RawPretestAnswer[]): TransformedAnswer[] {
    return answers.flatMap(answer => 
        answer.answers.map(ans => ({
            _id: answer._id,
            userId: answer.user._id,
            questionId: ans.pretest,
            answer: ans.answer,
            createdAt: answer.createdAt,
            updatedAt: answer.updatedAt,
            user: transformUserData(answer.user)
        }))
    );
}

function transformUserData(user: UserInAnswer) {
    return {
        _id: user._id,
        name: user.name,
        username: user.username,
        userType: user.role,
        metadata: { major: user.metadata.major },
        school: user.metadata.major?.school?.name?.en || '',
        major: user.metadata.major?.name?.en || ''
    };
}

// Main Component
export default function AssessmentOverviewDashboard({
    type,
    loading: initialLoading = false,
    answers: initialAnswers = [],
    questions = []
}: AssessmentOverviewDashboardProps) {
    const { filterState, handleFilterChange, handlePageChange, handleResetFilters } = useFilterReducer();
    const { questionSummaryData, loading: summaryLoading } = useQuestionSummary(type);
    const { pretestAnswers, posttestAnswers, allQuestions, loading: loadingAnswers } = useAssessmentData();
    const { filterData, loading: filterLoading } = useFilterData();

    // Use the appropriate answers based on type
    const answers = useMemo(() => {
        if (loadingAnswers) return [];
        return type === 'pretest' ? pretestAnswers : posttestAnswers;
    }, [type, pretestAnswers, posttestAnswers, loadingAnswers]);

    // Memoized data transformations
    const combinedAnswers = useMemo(() => {
        if (loadingAnswers) return [];
        return transformRawAnswersToTestAnswers(
            type === 'pretest' ? pretestAnswers : [],
            type === 'posttest' ? posttestAnswers : [],
            allQuestions
        );
    }, [type, pretestAnswers, posttestAnswers, allQuestions, loadingAnswers]);

    const filteredCombinedAnswers = useMemo(() => {
        const { userType, school, major, searchQuery } = filterState;
        const searchLower = searchQuery.toLowerCase();

        return combinedAnswers.filter(answer => {
            if (userType !== "All" && answer.user?.userType !== userType) return false;
            if (school !== "All" && answer.user?.school !== school) return false;
            if (major !== "All" && answer.user?.major !== major) return false;
            if (searchQuery) {
                const userName = typeof answer.user?.name === 'object'
                    ? `${answer.user.name.first} ${answer.user.name.middle || ''} ${answer.user.name.last}`.trim()
                    : answer.user?.name || '';
                return userName.toLowerCase().includes(searchLower) ||
                       answer.userId.toLowerCase().includes(searchLower);
            }
            return true;
        });
    }, [combinedAnswers, filterState]);

    const stats = useMemo(() => ({
        totalStudents: new Set(filteredCombinedAnswers.map(a => a.userId)).size,
        totalAttempts: filteredCombinedAnswers.length,
        averageScore: calculateAverageScore(filteredCombinedAnswers),
        completionRate: calculateCompletionRate(filteredCombinedAnswers),
        averageTimeSpent: calculateAverageTimeSpent(filteredCombinedAnswers),
        difficultyDistribution: calculateDifficultyDistribution(filteredCombinedAnswers, allQuestions),
        questionTypeDistribution: calculateQuestionTypeDistribution(filteredCombinedAnswers, allQuestions),
        scoreDistribution: calculateScoreDistribution(filteredCombinedAnswers),
        studentDetails: calculateStudentDetails(filteredCombinedAnswers, allQuestions),
    }), [filteredCombinedAnswers, allQuestions]);

    const questionStats = useMemo(() => {
        if (!questionSummaryData?.length) return [];
        
        return questionSummaryData
            .map(item => {
                const question = type === 'pretest' ? item.pretest : item.posttest;
                if (!question) return null;

                return {
                    _id: question._id,
                    type: question.type as QuestionType,
                    displayType: question.displayType as DisplayType,
                    question: question.question,
                    order: question.order || 0,
                    banner: null,
                    createdAt: question.createdAt,
                    updatedAt: question.updatedAt,
                    averageScore: item.average || 0,
                    totalAnswers: item.count || 0
                };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [questionSummaryData, type]);

    const downloadCSV = useCallback(() => {
        const dataToExport = stats.studentDetails.map(student => ({
            "Student ID": student.userId,
            "Name": student.name || "N/A",
            "School": student.school || "N/A",
            "Major": student.major || "N/A",
            "Submit": student.completed ? "true" : "false",
            ...(student.skillRatings && Object.fromEntries(
                Object.entries(student.skillRatings).map(([skill, value]) => [skill, value])
            ))
        }));

        const headers = Object.keys(dataToExport[0]);
        const csv = [
            headers.join(","),
            ...dataToExport.map(row => headers.map(header => (row as Record<string, any>)[header]).join(","))
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${type}_student_details.csv`;
        link.click();
    }, [stats.studentDetails, type]);

    if (initialLoading || summaryLoading || filterLoading || loadingAnswers) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner size="lg" />
            </div>
        );
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

            <StatisticsCards type={type} />

            <QuestionSummary questions={questionStats} />

            <ScoreDistributionChart data={stats.scoreDistribution} />

            <CustomStudentDetailsTable
                students={stats.studentDetails}
                filteredCount={stats.studentDetails.length}
                page={filterState.page}
                rowsPerPage={ROWS_PER_PAGE}
                onPageChange={handlePageChange}
                onExportCSV={downloadCSV}
                searchQuery={filterState.searchQuery}
                userType={filterState.userType}
                school={filterState.school}
                major={filterState.major}
            />
        </div>
    );
} 