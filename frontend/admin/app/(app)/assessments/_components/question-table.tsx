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
  Tooltip,
} from "@heroui/react";
import { Search, Filter, ChevronDown, Edit, Trash2, Eye, Plus } from "lucide-react";
import { Question, AssessmentType, QuestionTypeOption } from "@/types/assessment";

interface QuestionTableProps {
  questions: Question[];
  type: AssessmentType;
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
  onView: (question: Question) => void;
  onAdd: () => void;
}

const questionTypes: QuestionTypeOption[] = [
  { value: "text", label: "Text", color: "default" },
  { value: "rating", label: "Rating", color: "primary" },
  { value: "dropdown", label: "Dropdown", color: "secondary" },
  { value: "checkbox", label: "Checkbox", color: "success" },
  { value: "radio", label: "Radio", color: "warning" },
];

export default function QuestionTable({
  questions,
  type,
  onEdit,
  onDelete,
  onView,
  onAdd,
}: QuestionTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Question>("order");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;


  // Filter and sort questions
  const filteredQuestions = useMemo(() => {
    return questions
      .filter((question) => {
        const matchesSearch = 
          question.question.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
          question.question.th.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === "all" || question.type === typeFilter;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        const direction = sortDirection === "asc" ? 1 : -1;

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
  }, [questions, searchQuery, typeFilter, sortField, sortDirection]);

  // Pagination
  const pages = Math.ceil(filteredQuestions.length / rowsPerPage);
  const paginatedQuestions = filteredQuestions.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleSort = (field: keyof Question) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "text":
        return "primary";
      case "rating":
        return "success";
      case "dropdown":
        return "warning";
      case "checkbox":
        return "danger";
      case "radio":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
              Type: {typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Question type filter"
            onAction={(key) => setTypeFilter(key as string)}
          >
            <DropdownItem key="all">All</DropdownItem>
            <DropdownItem key="text">Text</DropdownItem>
            <DropdownItem key="rating">Rating</DropdownItem>
            <DropdownItem key="dropdown">Dropdown</DropdownItem>
            <DropdownItem key="checkbox">Checkbox</DropdownItem>
            <DropdownItem key="radio">Radio</DropdownItem>
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
            <TableColumn
              className="cursor-pointer"
              onClick={() => handleSort("order")}
            >
              Order
              {sortField === "order" && (
                <span className="ml-1">
                  {sortDirection === "asc" ? "↑" : "↓"}
                </span>
              )}
            </TableColumn>
            <TableColumn
              className="cursor-pointer"
              onClick={() => handleSort("type")}
            >
              Type
              {sortField === "type" && (
                <span className="ml-1">
                  {sortDirection === "asc" ? "↑" : "↓"}
                </span>
              )}
            </TableColumn>
            <TableColumn>Question (EN)</TableColumn>
            <TableColumn>Question (TH)</TableColumn>
            <TableColumn
              className="cursor-pointer"
              onClick={() => handleSort("createdAt")}
            >
              Created At
              {sortField === "createdAt" && (
                <span className="ml-1">
                  {sortDirection === "asc" ? "↑" : "↓"}
                </span>
              )}
            </TableColumn>
            <TableColumn>Actions</TableColumn>
          </TableHeader>
          <TableBody
            loadingContent={<Spinner />}
            emptyContent={
              <div className="py-8 text-center text-default-400">
                {searchQuery || typeFilter !== "all"
                  ? "No questions match your search criteria"
                  : "No questions available"}
              </div>
            }
          >
            {paginatedQuestions.map((question) => (
              <TableRow key={question._id}>
                <TableCell>{question.order}</TableCell>
                <TableCell>
                  <Chip
                    size="sm"
                    color={getTypeColor(question.type)}
                    variant="flat"
                  >
                    {question.type.charAt(0).toUpperCase() + question.type.slice(1)}
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
      {pages > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={pages}
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