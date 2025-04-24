"use client";

import { useState, useEffect } from "react";
import { Button, Card, CardBody, CardHeader, Chip, Divider, Spinner } from "@heroui/react";
import { CategoryModal } from "./_components/CategoryModal";
import { ProblemModal } from "./_components/ProblemModal";
import { ProblemCharts } from "./_components/ProblemCharts";
import type { Category, Problem } from "@/types/report";

interface MockupData {
    categories: Category[];
    problems: Problem[];
}

export default function ReportsPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [problems, setProblems] = useState<Problem[]>([]);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
    const [selectedProblem, setSelectedProblem] = useState<Problem | undefined>();
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

                // Convert string dates to Date objects
                const processedCategories = categoriesData.categories.map((cat: any) => ({
                    ...cat,
                    createdAt: new Date(cat.createdAt),
                    updatedAt: new Date(cat.updatedAt)
                }));

                const processedProblems = problemsData.problems.map((prob: any) => ({
                    ...prob,
                    createdAt: new Date(prob.createdAt),
                    updatedAt: new Date(prob.updatedAt)
                }));

                setCategories(processedCategories);
                setProblems(processedProblems);
            } catch (error) {
                console.error("Error loading mockup data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMockupData();
    }, []);

    const handleCategorySubmit = (category: Category) => {
        if (selectedCategory) {
            setCategories(categories.map(c => c.id === category.id ? category : c));
        } else {
            setCategories([...categories, category]);
        }
        setSelectedCategory(undefined);
    };

    const handleProblemSubmit = (problem: Problem) => {
        if (selectedProblem) {
            setProblems(problems.map(p => p.id === problem.id ? problem : p));
        } else {
            setProblems([...problems, problem]);
        }
        setSelectedProblem(undefined);
    };

    const getSeverityColor = (severity: Problem["severity"]) => {
        switch (severity) {
            case "low": return "success";
            case "medium": return "warning";
            case "high": return "danger";
            case "critical": return "danger";
            default: return "default";
        }
    };

    const getStatusColor = (status: Problem["status"]) => {
        switch (status) {
            case "open": return "danger";
            case "in-progress": return "warning";
            case "resolved": return "success";
            default: return "default";
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Reports</h1>
                <div className="flex gap-2">
                    <Button
                        color="primary"
                        onPress={() => {
                            setSelectedCategory(undefined);
                            setIsCategoryModalOpen(true);
                        }}
                    >
                        Add Category
                    </Button>
                    <Button
                        color="secondary"
                        onPress={() => {
                            setSelectedProblem(undefined);
                            setIsProblemModalOpen(true);
                        }}
                        isDisabled={categories.length === 0}
                    >
                        Add Problem
                    </Button>
                </div>
            </div>

            {/* Problem Statistics Charts */}
            <ProblemCharts problems={problems} categories={categories} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                    <Card key={category.id} className="border-2" style={{ borderColor: category.color }}>
                        <CardHeader className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold">{category.name.en}</h3>
                                <p className="text-sm text-gray-500">{category.name.th}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="flat"
                                    onPress={() => {
                                        setSelectedCategory(category);
                                        setIsCategoryModalOpen(true);
                                    }}
                                >
                                    Edit
                                </Button>
                                <Button
                                    size="sm"
                                    color="danger"
                                    variant="light"
                                    onPress={() => {
                                        setCategories(categories.filter(c => c.id !== category.id));
                                        setProblems(problems.filter(p => p.categoryId !== category.id));
                                    }}
                                >
                                    Delete
                                </Button>
                            </div>
                        </CardHeader>
                        <Divider />
                        <CardBody>
                            <div className="space-y-4">
                                {problems
                                    .filter(problem => problem.categoryId === category.id)
                                    .map(problem => (
                                        <div
                                            key={problem.id}
                                            className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                                            onClick={() => {
                                                setSelectedProblem(problem);
                                                setIsProblemModalOpen(true);
                                            }}
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
                                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                                {problem.description.en}
                                            </p>
                                        </div>
                                    ))}
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>

            <CategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                onSubmit={handleCategorySubmit}
                category={selectedCategory}
                mode={selectedCategory ? "edit" : "add"}
            />

            <ProblemModal
                isOpen={isProblemModalOpen}
                onClose={() => setIsProblemModalOpen(false)}
                onSubmit={handleProblemSubmit}
                problem={selectedProblem}
                categories={categories}
                mode={selectedProblem ? "edit" : "add"}
            />
        </div>
    );
}
