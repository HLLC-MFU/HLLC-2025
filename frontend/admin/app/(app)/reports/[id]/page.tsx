"use client";

import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Pagination,
} from "@heroui/react";
import { ArrowLeft } from "lucide-react";

import StatusDropdown from "../_components/Statusdropdown";
import SendNotiButton from "../_components/SendNotiButton";
import { ProblemCharts } from "../_components/ProblemCharts";

import { useReportTypes } from "@/hooks/useReportTypes";
import { useReports } from "@/hooks/useReports";
import { useState } from "react";

export default function CategoryReportsPage() {
  const { id } = useParams();
  const router = useRouter();

  const { reporttypes: categories } = useReportTypes();
  const { reports, updateReport } = useReports();

  const selectedCategory = categories.find((cat) => cat._id === id);
  const filteredReports = reports.filter((r) => r.category._id === id);

  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 20;
  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * reportsPerPage,
    currentPage * reportsPerPage
  );

  if (!selectedCategory) {
    return (
      <div className="flex justify-center items-center h-screen">
        <h2 className="text-xl">Category not found</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg">
        <CardHeader className="flex justify-between items-center">
          <div className="text-start flex gap-4 items-center">
            <Button
              startContent={<ArrowLeft />}
              variant="flat"
              onPress={() => router.back()}
            >
              Back
            </Button>
            <div className="flex flex-col">
              <h2 className="text-xl font-semibold">{selectedCategory.name.en}</h2>
              <p className="text-sm text-gray-500">{selectedCategory.name.th}</p>
            </div>
          </div>
          <Chip size="sm" style={{ backgroundColor: selectedCategory.color }}>
            {filteredReports.length} Reports
          </Chip>
        </CardHeader>
        <CardBody>
          <ProblemCharts problems={filteredReports} reporttypes={[selectedCategory]} />
        </CardBody>
      </Card>

      <Card className="bg">
        <CardHeader>
          <h3 className="text-lg font-semibold">Report List</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {paginatedReports.map((report) => (
              <div
                key={report._id}
                className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium">{report.reporter?.name.first ?? "Unknown"}</h4>
                    <p className="text-sm text-gray-500">{report.status}</p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <StatusDropdown
                      status={report.status}
                      onChange={(newStatus) => updateReport(report._id, { status: newStatus })}
                    />
                    <SendNotiButton />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">{report.message}</p>
              </div>
            ))}
            {totalPages > 1 && (
              <div className="flex justify-center pt-6">
                <Pagination
                  isCompact
                  showControls
                  total={totalPages}
                  page={currentPage}
                  onChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
