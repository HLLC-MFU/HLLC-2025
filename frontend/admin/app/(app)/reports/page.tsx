'use client';

import { useState, useEffect } from 'react';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Divider,
    Skeleton,
} from '@heroui/react';
import { CategoryModal } from './_components/CategoryModal';
// import { ProblemModal } from './_components/ProblemModal';
import { ProblemCharts } from './_components/ProblemCharts';
import type { Category, Problem } from '@/types/report';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusDropdown from './_components/Statusdropdown';
import SendNotiButton from './_components/SendNotiButton';
import { useCategories } from "@/hooks/useCategories";
import { useReports } from "@/hooks/useReports";

export default function ReportsPage() {
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
    const [selectedProblem, setSelectedProblem] = useState<Problem | undefined>();

    const router = useRouter();
    const {
        categories,
        loading,
        addCategory,
        updateCategory,
        deleteCategory,
    } = useCategories();

    const {
        problems,
        loading: loadingReports,
        updateStatus,
        addOrEditProblem,
        removeByCategory
    } = useReports();

    const handleProblemSubmit = (problem: Problem) => {
        addOrEditProblem(problem);
        setSelectedProblem(undefined);
    };

    const handleStatusChange = async (id: string, newStatus: Problem['status']) => {
        await updateStatus(id, newStatus);
    };



    return (
        <div className="flex min-h-screen flex-col">
            <div className="container mx-auto flex items-center justify-between px-4 py-6">
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

            <ProblemCharts problems={problems} categories={categories} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.map(category => (
                    <Card
                        key={category.id}
                        className="border-2"
                        style={{ borderColor: category.color }}
                        isHoverable
                    >
                        <CardHeader className="flex items-center justify-between">
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
                                    onClick={e => {
                                        e.stopPropagation();
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
                                    onClick={async e => {
                                        e.stopPropagation();
                                        try {
                                            await deleteCategory(category.id);
                                            removeByCategory(category.id);

                                        } catch (error) {
                                            console.error("Failed to delete category:", error);
                                        }
                                    }}
                                >
                                    Delete
                                </Button>
                            </div>
                        </CardHeader>
                        <Divider />
                        <CardBody
                            className="cursor-pointer"
                            onClick={() => router.push(`/reports/${category.id}`)}
                        >
                            <div className="space-y-4">
                                {problems
                                    .filter(problem => problem.categoryId === category.id)
                                    .map(problem => (
                                        <div
                                            key={problem.id}
                                            className="rounded-lg border border-gray-200 p-3 hover:border-gray-300"
                                            onClick={e => {
                                                e.stopPropagation();
                                                setSelectedProblem(problem);
                                                setIsProblemModalOpen(true);
                                            }}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="font-medium">{problem.title.en}</h4>
                                                    <p className="text-sm text-gray-500">{problem.title.th}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <StatusDropdown
                                                        status={problem.status}
                                                        onChange={newStatus => handleStatusChange(problem.id, newStatus)}
                                                    />

                                                    <SendNotiButton />
                                                </div>
                                            </div>
                                            <p className="mt-2 line-clamp-2 text-sm text-gray-600">
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
                onSubmit={() => setSelectedCategory(undefined)}
                onAdd={addCategory}
                onUpdate={updateCategory}
                category={selectedCategory}
                mode={selectedCategory ? 'edit' : 'add'}
            />

            {/* <ProblemModal
                isOpen={isProblemModalOpen}
                onClose={() => setIsProblemModalOpen(false)}
                onSubmit={handleProblemSubmit}
                problem={selectedProblem}
                categories={categories}
                mode={selectedProblem ? 'edit' : 'add'}
            /> */}
        </div>
    );
}
