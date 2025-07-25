"use client";

import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
} from "@heroui/react";
import { ArrowLeft } from "lucide-react";

import StatusDropdown from "../_components/Statusdropdown";
import SendNotiButton from "../_components/SendNotiButton";
import { ProblemCharts } from "../_components/ProblemCharts";

import { useReportTypes } from "@/hooks/useReportTypes";
import { useReports } from "@/hooks/useReports";
import { Pagination } from "@heroui/react";
import { useState } from "react";


export default function CategoryReportsPage() {
  const { id } = useParams();
  const router = useRouter();

  const { reporttypes: categories } = useReportTypes();
  const {
    problems,
    updateStatus,
  } = useReports();

  const selectedCategory = categories.find((cat) => cat.id === id);
  const filteredProblems = problems.filter((p) => p.categoryId === id);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const paginatedProblems = filteredProblems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
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
      <Card>
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
            {filteredProblems.length} Problems
          </Chip>
        </CardHeader>
        <CardBody>
          <ProblemCharts problems={filteredProblems} reporttypes={[selectedCategory]} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Problem List</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {paginatedProblems.map((problem) => (
              <div
                key={problem.id}
                className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium">{problem.title.en}</h4>
                    <p className="text-sm text-gray-500">{problem.title.th}</p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <StatusDropdown
                      status={problem.status}
                      onChange={(newStatus) => updateStatus(problem.id, newStatus)}
                    />
                    <SendNotiButton />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">{problem.description.en}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
      {/* Pagination */}
      {filteredProblems.length > itemsPerPage && (
        <div className="flex justify-center pt-4">
          <Pagination
            total={Math.ceil(filteredProblems.length / itemsPerPage)}
            initialPage={1}
            page={currentPage}
            onChange={setCurrentPage}
            isCompact
            showControls
          />
        </div>
      )}
    </div>
  );
}
