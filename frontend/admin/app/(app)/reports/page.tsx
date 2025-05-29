"use client";

import { useState, useEffect } from "react";
import { Button, Card, CardBody, CardHeader, Chip, Divider, Spinner, Skeleton } from "@heroui/react";
import { CategoryModal } from "./_components/CategoryModal";
import { ProblemModal } from "./_components/ProblemModal";
import { ProblemCharts } from "./_components/ProblemCharts";
import type { Category, Problem } from "@/types/report";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
    const router = useRouter();

    useEffect(() => {
  const fetchRealData = async () => {
    try {
      const [categoriesRes, reportsRes] = await Promise.all([
        fetch("http://localhost:8080/api/categories"),
        fetch("http://localhost:8080/api/reports"),
      ]);

      const categoriesJson = await categoriesRes.json();
      const reportsJson = await reportsRes.json();

      console.log("Categories data:", categoriesJson);
      console.log("Reports data:", reportsJson);

      const processedCategories = categoriesJson.data.map((cat: any) => ({
        ...cat,
        id: cat._id,
        createdAt: new Date(cat.createdAt ?? Date.now()),
        updatedAt: new Date(cat.updatedAt ?? Date.now()),
      }));

      const processedReports = reportsJson.data.map((report: any) => ({
        ...report,
        id: report._id,
        categoryId: report.category?._id ?? "",
        createdAt: new Date(report.createdAt ?? Date.now()),
        updatedAt: new Date(report.updatedAt ?? Date.now()),
        title: {
          en: report.message,
          th: report.message,
        },
        description: {
          en: "",
          th: "",
        },
        severity: "medium",
        status: report.status ?? "open",
      }));

      setCategories(processedCategories);
      setProblems(processedReports);
    } catch (error) {
      console.error("Error loading real data:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchRealData();
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
            <div className="flex flex-col min-h-screen">
                <div className="container mx-auto flex justify-between items-center px-4 py-6">
                    <div className="flex items-center justify-between mb-8">
                        <Skeleton className="w-32 h-10 rounded-lg" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="w-32 h-10 rounded-lg" />
                    </div>
                </div>

                {/* Problem Statistics Charts Skeleton */}
                <div className="container mx-auto px-4 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Skeleton className="w-full h-[300px] rounded-lg" />
                        <Skeleton className="w-full h-[300px] rounded-lg" />
                        <Skeleton className="w-full h-[300px] rounded-lg" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="border-2">
                            <CardHeader className="flex justify-between items-center">
                                <div className="text-start">
                                    <Skeleton className="w-32 h-6 rounded-lg" />
                                    <Skeleton className="w-24 h-4 rounded-lg mt-2" />
                                </div>
                                <div className="flex gap-2">
                                    <Skeleton className="w-16 h-8 rounded-lg" />
                                    <Skeleton className="w-16 h-8 rounded-lg" />
                                </div>
                            </CardHeader>
                            <Divider />
                            <CardBody>
                                <div className="space-y-4">
                                    {[1, 2].map((j) => (
                                        <div key={j} className="p-3 rounded-lg border border-gray-200">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <Skeleton className="w-40 h-5 rounded-lg" />
                                                    <Skeleton className="w-32 h-4 rounded-lg mt-2" />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Skeleton className="w-16 h-6 rounded-full" />
                                                    <Skeleton className="w-16 h-6 rounded-full" />
                                                </div>
                                            </div>
                                            <Skeleton className="w-full h-4 rounded-lg mt-2" />
                                            <Skeleton className="w-3/4 h-4 rounded-lg mt-2" />
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <div className="container mx-auto flex justify-between items-center px-4 py-6">
                <div className="flex w-full items-center justify-between">
                    <h1 className="text-3xl font-bold">Reports</h1>
                    <Button
                        color="primary"
                        onPress={() => {
                            setSelectedCategory(undefined);
                            setIsCategoryModalOpen(true);
                        }}
                    >
                        Add Category
                    </Button>
                </div>
            </div>

            {/* Problem Statistics Charts */}
            <ProblemCharts problems={problems} categories={categories} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                    <Card key={category.id} className="border-2" style={{ borderColor: category.color }} isHoverable isPressable onPress={() => {
                        router.push(`/reports/${category.id}`);
                    }}>
                        <CardHeader className="flex justify-between items-center">
                            <div className="text-start">
                                <Link href={`/reports/${category.id}`} className="hover:underline">
                                    <h3 className="text-lg font-semibold">{category.name.en}</h3>
                                    <p className="text-sm text-gray-500">{category.name.th}</p>
                                </Link>
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
