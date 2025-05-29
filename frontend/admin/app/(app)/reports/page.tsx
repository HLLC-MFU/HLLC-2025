'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Spinner,
  Skeleton,
} from '@heroui/react';
import { CategoryModal } from './_components/CategoryModal';
import { ProblemModal } from './_components/ProblemModal';
import { ProblemCharts } from './_components/ProblemCharts';
import type { Category, Problem } from '@/types/report';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusDropdown from './_components/Statusdropdown';
import SendNotiButton from './_components/SendNotiButton';

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
          fetch('http://localhost:8080/api/categories'),
          fetch('http://localhost:8080/api/reports'),
        ]);

        const categoriesJson = await categoriesRes.json();
        const reportsJson = await reportsRes.json();

        console.log('Categories data:', categoriesJson);
        console.log('Reports data:', reportsJson);

        const processedCategories = categoriesJson.data.map((cat: any) => ({
          ...cat,
          id: cat._id,
          createdAt: new Date(cat.createdAt ?? Date.now()),
          updatedAt: new Date(cat.updatedAt ?? Date.now()),
        }));

        const processedReports = reportsJson.data.map((report: any) => ({
          ...report,
          id: report._id,
          categoryId: report.category?._id ?? '',
          createdAt: new Date(report.createdAt ?? Date.now()),
          updatedAt: new Date(report.updatedAt ?? Date.now()),
          title: {
            en: report.message,
            th: report.message,
          },
          description: {
            en: '',
            th: '',
          },
          severity: 'medium',
          status: report.status ?? 'Pending',
        }));

        setCategories(processedCategories);
        setProblems(processedReports);
      } catch (error) {
        console.error('Error loading real data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, []);

  const handleCategorySubmit = async (category: Category) => {
    setSelectedCategory(undefined);

    try {
      const categoriesRes = await fetch('http://localhost:8080/api/categories');
      const categoriesJson = await categoriesRes.json();

      const processedCategories = categoriesJson.data.map((cat: any) => ({
        ...cat,
        id: cat._id,
        createdAt: new Date(cat.createdAt ?? Date.now()),
        updatedAt: new Date(cat.updatedAt ?? Date.now()),
      }));

      setCategories(processedCategories);
    } catch (error) {
      console.error('Error refetching categories:', error);
    }
  };

  const handleProblemSubmit = (problem: Problem) => {
    if (selectedProblem) {
      setProblems(problems.map(p => (p.id === problem.id ? problem : p)));
    } else {
      setProblems([...problems, problem]);
    }
    setSelectedProblem(undefined);
  };

  const handleStatusChange = async (id: string, newStatus: Problem['status']) => {
    try {
      await fetch(`http://localhost:8080/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      setProblems(prev =>
        prev.map(p => (p.id === id ? { ...p, status: newStatus, updatedAt: new Date() } : p))
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const getStatusColor = (status: Problem['status']) => {
    switch (status) {
      case 'open':
        return 'danger';
      case 'in-progress':
        return 'warning';
      case 'resolved':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="container mx-auto flex items-center justify-between px-4 py-6">
          <div className="mb-8 flex items-center justify-between">
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>

        {/* Problem Statistics Charts Skeleton */}
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-[300px] w-full rounded-lg" />
            <Skeleton className="h-[300px] w-full rounded-lg" />
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-2">
              <CardHeader className="flex items-center justify-between">
                <div className="text-start">
                  <Skeleton className="h-6 w-32 rounded-lg" />
                  <Skeleton className="mt-2 h-4 w-24 rounded-lg" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16 rounded-lg" />
                  <Skeleton className="h-8 w-16 rounded-lg" />
                </div>
              </CardHeader>
              <Divider />
              <CardBody>
                <div className="space-y-4">
                  {[1, 2].map(j => (
                    <div key={j} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <Skeleton className="h-5 w-40 rounded-lg" />
                          <Skeleton className="mt-2 h-4 w-32 rounded-lg" />
                        </div>
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-16 rounded-full" />
                          <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                      </div>
                      <Skeleton className="mt-2 h-4 w-full rounded-lg" />
                      <Skeleton className="mt-2 h-4 w-3/4 rounded-lg" />
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
    <div className="flex min-h-screen flex-col">
      <div className="container mx-auto flex items-center justify-between px-4 py-6">
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
                    e.stopPropagation(); // ✅ ป้องกันการ trigger onClick จาก parent
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
                      await fetch(`http://localhost:8080/api/categories/${category.id}`, {
                        method: 'DELETE',
                      });

                      // ถ้า delete สำเร็จ ค่อยลบจาก state
                      setCategories(categories.filter(c => c.id !== category.id));
                      setProblems(problems.filter(p => p.categoryId !== category.id));
                    } catch (error) {
                      console.error('Failed to delete category:', error);
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
                      className="cursor-pointer rounded-lg border border-gray-200 p-3 transition-colors hover:border-gray-300"
                      onClick={e => {
                        e.stopPropagation(); // ✅ ป้องกันการพาไปหน้าใหม่
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
        onSubmit={handleCategorySubmit}
        category={selectedCategory}
        mode={selectedCategory ? 'edit' : 'add'}
      />

      <ProblemModal
        isOpen={isProblemModalOpen}
        onClose={() => setIsProblemModalOpen(false)}
        onSubmit={handleProblemSubmit}
        problem={selectedProblem}
        categories={categories}
        mode={selectedProblem ? 'edit' : 'add'}
      />
    </div>
  );
}
