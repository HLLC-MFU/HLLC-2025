'use client';

import type { ReportTypes, Problem } from '@/types/report';

import { useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
} from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { CategoryModal } from './_components/CategoryModal';
import { ProblemCharts } from './_components/ProblemCharts';
import StatusDropdown from './_components/Statusdropdown';
import SendNotiButton from './_components/SendNotiButton';
import { ProblemModal } from './_components/ProblemModal';

import { useReportTypes } from '@/hooks/useReportTypes';
import { useReports } from '@/hooks/useReports';
import { ProblemModal } from './_components/ProblemModal';
import { PageHeader } from '@/components/ui/page-header';
import { Plus, ShieldAlert } from 'lucide-react';

export default function ReportsPage() {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ReportTypes | undefined>();
  const [selectedProblem, setSelectedProblem] = useState<Problem | undefined>();

  const router = useRouter();

  const {
    reporttypes,
    addReportTypes,
    updateReportTypes,
    deleteReportTypes,
    fetchReportTypes,
  } = useReportTypes();

  const {
    problems,
    updateStatus,
    fetchReports,
    addOrEditProblem,
    removeByCategory,
  } = useReports();

  const handleProblemSubmit = (problem: Problem) => {
    addOrEditProblem(problem);
    setSelectedProblem(undefined);
  };

  const handleStatusChange = async (id: string, newStatus: Problem['status']) => {
    await updateStatus(id, newStatus);
  };

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="container mx-auto px-4 py-6">
          <PageHeader
            title="Reports Management"
            description="This is Reports Page"
            icon={<ShieldAlert />}
            right={
              <div className="w-full sm:w-auto">
                <Button
                  color="primary"
                  endContent={<Plus size={20} />}
                  size="lg"
                  onPress={() => {
                    setSelectedCategory(undefined);
                    setIsCategoryModalOpen(true);
                  }}
                >
                  Add Category
                </Button>
              </div>
            }
          />

          <ProblemCharts problems={problems} reporttypes={reporttypes} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reporttypes.map((category) => {
              const filteredProblems = problems.filter(
                (p) => p.categoryId === category.id,
              );
              return (
                <Card
                  key={category.id}
                  className="border-2"
                  style={{ borderColor: category.color }}
                  isHoverable
                >
                  <CardHeader className="flex items-center justify-between">
                    <div className="text-start">
                      <Link
                        href={`/reports/${category.id}`}
                        className="hover:underline"
                      >
                        <h3 className="text-lg font-semibold">
                          {category.name.en}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {category.name.th}
                        </p>
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
                        onPress={async () => {
                          try {
                            await deleteReportTypes(category.id);
                            await removeByCategory(category.id);
                            await fetchReportTypes();
                            await fetchReports();
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
                      {filteredProblems.slice(0, 4).map((problem) => (
                        <div
                          key={problem.id}
                          className="rounded-lg border border-gray-200 p-3 hover:border-gray-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProblem(problem);
                            setIsProblemModalOpen(true);
                          }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">
                                {problem.title.en}
                              </h4>
                              <p className="text-sm text-gray-500 truncate">
                                {problem.title.th}
                              </p>
                            </div>
                            <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:justify-end">
                              <StatusDropdown
                                status={problem.status}
                                onChange={(newStatus) =>
                                  handleStatusChange(problem.id, newStatus)
                                }
                              />
                              <SendNotiButton />
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2 sm:line-clamp-3">
                            {problem.description.en}
                          </p>
                        </div>
                      ))}
                      <div className="flex justify-between items-center mt-4 px-1 text-sm text-gray-500">
                        <span>{filteredProblems.length} reports</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/reports/${category.id}`);
                          }}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          View all
                        </button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>

          <CategoryModal
            isOpen={isCategoryModalOpen}
            onClose={() => setIsCategoryModalOpen(false)}
            onSubmit={() => setSelectedCategory(undefined)}
            onAdd={addReportTypes}
            onUpdate={updateReportTypes}
            reporttypes={selectedCategory}
            mode={selectedCategory ? 'edit' : 'add'}
          />

          <ProblemModal
            isOpen={isProblemModalOpen}
            onClose={() => setIsProblemModalOpen(false)}
            onSubmit={handleProblemSubmit}
            problem={selectedProblem}
            categories={reporttypes}
            mode={selectedProblem ? 'edit' : 'add'}
          />
        </div>
      </div>
    </>
  );
}
