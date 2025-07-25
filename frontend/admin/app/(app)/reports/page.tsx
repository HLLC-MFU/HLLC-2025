'use client';

import type { Report, ReportTypes } from '@/types/report';

import { useState, useEffect } from 'react';
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
import { useReportTypes } from '@/hooks/useReportTypes';
import { useReports } from '@/hooks/useReports';
import { ProblemModal } from './_components/ProblemModal';
import { PageHeader } from '@/components/ui/page-header';
import { Plus, ShieldAlert } from 'lucide-react';

export default function ReportsPage() {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ReportTypes | undefined>();
  const [selectedReport, setSelectedReport] = useState<Report | undefined>();

  const router = useRouter();

  const {
    reporttypes,
    fetchReportTypes,
    addReportTypes,
    updateReportTypes,
    deleteReportTypes,
  } = useReportTypes();

  const {
    reports,
    fetchReports,
    createReport,
    updateReport,
    deleteReport,
  } = useReports();

  useEffect(() => {
    fetchReportTypes();
    fetchReports();
  }, []);

  const handleReportSubmit = async (report: Report) => {
    try {
      if (report._id) {
        await updateReport(report._id, report);
      } else {
        await createReport(report);
      }
      await fetchReports();
    } catch (err) {
      console.error('Failed to save report:', err);
    }
    setSelectedReport(undefined);
    setIsProblemModalOpen(false);
  };

  const handleStatusChange = async (id: string, newStatus: Report['status']) => {
    try {
      await updateReport(id, { status: newStatus });
      await fetchReports();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <PageHeader
          title="Reports Management"
          description="This is Reports Page"
          icon={<ShieldAlert />}
          right={
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
          }
        />

        <ProblemCharts problems={reports} reporttypes={reporttypes} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reporttypes.map((category) => {
            const filteredReports = reports.filter(
              (report) => report.category._id === category._id,
            );

            return (
              <Card
                key={category._id}
                className="border-2"
                style={{ borderColor: category.color ?? '#ccc' }}
                isHoverable
              >
                <CardHeader className="flex items-center justify-between">
                  <div className="text-start">
                    <Link
                      href={`/reports/${category._id}`}
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
                          await deleteReportTypes(category._id);
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
                  onClick={() => router.push(`/reports/${category._id}`)}
                >
                  <div className="space-y-4">
                    {filteredReports.slice(0, 4).map((report) => (
                      <div
                        key={report._id}
                        className="rounded-lg border border-gray-200 p-3 hover:border-gray-300"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">
                              {report.reporter?.name.first ?? 'Unknown'}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {report.status}
                            </p>
                          </div>
                          <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:justify-end">
                            <StatusDropdown
                              status={report.status}
                              onChange={(newStatus) =>
                                handleStatusChange(report._id, newStatus)
                              }
                            />
                            <SendNotiButton />
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2 sm:line-clamp-3">
                          {report.message}
                        </p>
                      </div>
                    ))}
                    <div className="flex justify-between items-center mt-4 px-1 text-sm text-gray-500">
                      <span>{filteredReports.length} reports</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/reports/${category._id}`);
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
          onSubmit={handleReportSubmit}
          report={selectedReport!}
          categories={reporttypes}
        />

      </div>
    </div>
  );
}
