"use client";

import { Card, CardBody, CardHeader, Button, Chip } from "@heroui/react";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import type { Problem, Category } from "@/types/report";
import { ProblemCharts } from "../_components/ProblemCharts";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface MockupData {
    categories: Category[];
    problems: Problem[];
}

export default function CategoryReportsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [problems, setProblems] = useState<Problem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMockupData = async () => {
            try {
                const [categoriesResponse, problemsResponse] = await Promise.all([
                    fetch('/mock/categories.json'),
                    fetch('/mock/problems.json')
                ]);

                const categoriesData = await categoriesResponse.json();
                const problemsData = await problemsResponse.json();

                // Find the selected category
                const category = categoriesData.categories.find((cat: Category) => cat.id === id);
                if (category) {
                    setSelectedCategory(category);
                    // Filter problems for this category
                    const categoryProblems = problemsData.problems.filter(
                        (prob: Problem) => prob.categoryId === id
                    );
                    setProblems(categoryProblems);
                }
            } catch (error) {
                console.error("Error loading mockup data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMockupData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!selectedCategory) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold mb-2">Category not found</h2>
                    <p className="text-gray-500">The requested category does not exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="bg-white">
                <CardHeader className="flex justify-between items-center">
                    <div className="text-start flex gap-4 items-center">
                        <Button
                            variant="flat"
                            startContent={<ArrowLeft />}
                            onPress={() => router.back()}
                        >
                            Back
                        </Button>
                        <div className="flex flex-col">
                            <h2 className="text-xl font-semibold">{selectedCategory.name.en}</h2>
                            <p className="text-sm text-gray-500">{selectedCategory.name.th}</p>
                        </div>
                    </div>
                    <Chip
                        size="sm"
                        style={{ backgroundColor: selectedCategory.color }}
                    >
                        {problems.length} Problems
                    </Chip>
                </CardHeader>
            </Card>

            <Card className="bg-white">
                <CardHeader>
                    <h3 className="text-lg font-semibold">Problem List</h3>
                </CardHeader>
                <CardBody>
                    <div className="space-y-4">
                        {problems.map(problem => (
                            <div
                                key={problem.id}
                                className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-medium">{problem.title.en}</h4>
                                        <p className="text-sm text-gray-500">{problem.title.th}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Chip
                                            size="sm"
                                            color={getSeverityColor(problem.severity)}
                                        >
                                            {problem.severity}
                                        </Chip>
                                        <Chip
                                            size="sm"
                                            color={getStatusColor(problem.status)}
                                        >
                                            {problem.status}
                                        </Chip>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">
                                    {problem.description.en}
                                </p>
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}

function getSeverityColor(severity: string) {
    switch (severity.toLowerCase()) {
        case 'low':
            return 'success';
        case 'medium':
            return 'warning';
        case 'high':
            return 'danger';
        case 'critical':
            return 'danger';
        default:
            return 'default';
    }
}

function getStatusColor(status: string) {
    switch (status.toLowerCase()) {
        case 'open':
            return 'primary';
        case 'in-progress':
            return 'warning';
        case 'resolved':
            return 'success';
        default:
            return 'default';
    }
} 