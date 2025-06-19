"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Button,
  Chip,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
  Spinner,
} from "@heroui/react";
import { Search, Filter, ChevronDown, Edit, Trash2, Eye, Plus } from "lucide-react";
import { Question, AssessmentType } from "@/types/assessment";
import { QUESTION_TYPES, DISPLAY_TYPES, QUESTION_TYPE_COLORS } from "../_constants/question-types";

interface QuestionTableProps {
  questions: Question[];
  type: AssessmentType;
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
  onView: (question: Question) => void;
  onAdd: () => void;
}

type SortConfig = {
  field: keyof Question;
  direction: "asc" | "desc";
};

type FilterConfig = {
  search: string;
  type: string;
  displayType: string;
};

export default function QuestionTable({
  questions,
  type,
  onEdit,
  onDelete,
  onView,
  onAdd,
}: QuestionTableProps) {
  const [filter, setFilter] = useState<FilterConfig>({
    search: "",
    type: "all",
    displayType: "all"
  });
  const [sort, setSort] = useState<SortConfig>({ field: "order", direction: "asc" });
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Filter and sort questions
  const { filteredQuestions, totalPages } = useMemo(() => {
    const filtered = questions
      .filter((question) => {
        const matchesSearch = 
          question.question.en.toLowerCase().includes(filter.search.toLowerCase()) ||
          question.question.th.toLowerCase().includes(filter.search.toLowerCase());
        const matchesType = filter.type === "all" || question.type === filter.type;
        const matchesDisplayType = filter.displayType === "all" || question.displayType === filter.displayType;
        return matchesSearch && matchesType && matchesDisplayType;
      })
      .sort((a, b) => {
        const aValue = a[sort.field];
        const bValue = b[sort.field];
        const direction = sort.direction === "asc" ? 1 : -1;

        if (typeof aValue === "string" && typeof bValue === "string") {
          return aValue.localeCompare(bValue) * direction;
        }
        if (typeof aValue === "number" && typeof bValue === "number") {
          return (aValue - bValue) * direction;
        }
        if (aValue instanceof Date && bValue instanceof Date) {
          return (aValue.getTime() - bValue.getTime()) * direction;
        }
        return 0;
      });

    return {
      filteredQuestions: filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage),
      totalPages: Math.ceil(filtered.length / rowsPerPage)
    };
  }, [questions, filter, sort, page]);

  const handleSort = (field: keyof Question) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const handleFilterChange = (key: keyof FilterConfig, value: string) => {
    setFilter(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filter changes
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search questions..."
            value={filter.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            startContent={<Search className="text-default-400" size={20} />}
            className="w-full"
          />
        </div>
        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="bordered"
              endContent={<ChevronDown className="text-default-400" size={20} />}
              startContent={<Filter className="text-default-400" size={20} />}
            >
              Type: {filter.type.charAt(0).toUpperCase() + filter.type.slice(1)}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Question type filter"
            onAction={(key) => handleFilterChange("type", key as string)}
            items={[
              { key: "all", label: "All" },
              ...QUESTION_TYPES.map(type => ({ key: type.value, label: type.label }))
            ]}
          >
            {(item) => (
              <DropdownItem key={item.key} textValue={item.label}>
                {item.label}
              </DropdownItem>
            )}
          </DropdownMenu>
        </Dropdown>
        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="bordered"
              endContent={<ChevronDown className="text-default-400" size={20} />}
              startContent={<Filter className="text-default-400" size={20} />}
            >
              Display: {filter.displayType.charAt(0).toUpperCase() + filter.displayType.slice(1)}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Display type filter"
            onAction={(key) => handleFilterChange("displayType", key as string)}
            items={[
              { key: "all", label: "All" },
              ...DISPLAY_TYPES.map(type => ({ key: type.value, label: type.label }))
            ]}
          >
            {(item) => (
              <DropdownItem key={item.key} textValue={item.label}>
                {item.label}
              </DropdownItem>
            )}
          </DropdownMenu>
        </Dropdown>
        <Button
          color="primary"
          startContent={<Plus size={20} />}
          onPress={onAdd}
        >
          Add Question
        </Button>
      </div>

      {/* Questions Table */}
      <div className="rounded-lg border border-default-200">
        <Table aria-label="Questions table">
          <TableHeader>
            {[
              { key: "order", label: "Order" },
              { key: "type", label: "Type" },
              { key: "displayType", label: "Display Type" },
              { key: "question", label: "Question (EN)" },
              { key: "questionTh", label: "Question (TH)" },
              { key: "createdAt", label: "Created At" },
              { key: "actions", label: "Actions" }
            ].map(({ key, label }) => (
              <TableColumn
                key={key}
                className={key !== "actions" ? "cursor-pointer" : ""}
                onClick={() => key !== "actions" && handleSort(key as keyof Question)}
              >
                {label}
                {sort.field === key && (
                  <span className="ml-1">{sort.direction === "asc" ? "↑" : "↓"}</span>
                )}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody
            loadingContent={<Spinner />}
            emptyContent={
              <div className="py-8 text-center text-default-400">
                {filter.search || filter.type !== "all" || filter.displayType !== "all"
                  ? "No questions match your search criteria"
                  : "No questions available"}
              </div>
            }
          >
            {filteredQuestions.map((question) => (
              <TableRow key={question._id}>
                <TableCell>{question.order}</TableCell>
                <TableCell>
                  <Chip
                    size="sm"
                    color={QUESTION_TYPE_COLORS[question.type]}
                    variant="flat"
                  >
                    {question.type.charAt(0).toUpperCase() + question.type.slice(1)}
                  </Chip>
                </TableCell>
                <TableCell>
                  <Chip
                    size="sm"
                    color={DISPLAY_TYPES.find(t => t.value === question.displayType)?.color || "default"}
                    variant="flat"
                  >
                    {DISPLAY_TYPES.find(t => t.value === question.displayType)?.label || "Both"}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="max-w-md">
                    <p className="text-sm font-medium">{question.question.en}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-md">
                    <p className="text-sm font-medium">{question.question.th}</p>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(question.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => onView(question)}
                    >
                      <Eye className="text-default-400" size={20} />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => onEdit(question)}
                    >
                      <Edit className="text-primary" size={20} />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => onDelete(question._id)}
                    >
                      <Trash2 size={20} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={totalPages}
            page={page}
            onChange={setPage}
            showControls
            classNames={{
              cursor: "bg-primary",
            }}
          />
        </div>
      )}
    </div>
  );
} 