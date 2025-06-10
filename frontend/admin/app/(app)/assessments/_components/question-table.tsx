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
import { Search, Filter, ChevronDown, Edit, Trash2, Eye } from "lucide-react";
import { Question, AssessmentType } from "@/types/assessment";

interface QuestionTableProps {
  questions: Question[];
  type: AssessmentType;
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
  onView: (question: Question) => void;
}

export default function QuestionTable({
  questions,
  type,
  onEdit,
  onDelete,
  onView,
}: QuestionTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Question>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Filter and sort questions
  const filteredQuestions = useMemo(() => {
    return questions
      .filter((question) => {
        const matchesSearch = question.text.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDifficulty = difficultyFilter === "all" || question.difficulty === difficultyFilter;
        return matchesSearch && matchesDifficulty;
      })
      .sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        const direction = sortDirection === "asc" ? 1 : -1;

        if (typeof aValue === "string" && typeof bValue === "string") {
          return aValue.localeCompare(bValue) * direction;
        }
        if (aValue instanceof Date && bValue instanceof Date) {
          return (aValue.getTime() - bValue.getTime()) * direction;
        }
        return 0;
      });
  }, [questions, searchQuery, difficultyFilter, sortField, sortDirection]);

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
      setSortDirection("desc");
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "success";
      case "medium":
        return "warning";
      case "hard":
        return "danger";
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
              Difficulty: {difficultyFilter.charAt(0).toUpperCase() + difficultyFilter.slice(1)}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Difficulty filter"
            onAction={(key) => setDifficultyFilter(key as string)}
          >
            <DropdownItem key="all">All</DropdownItem>
            <DropdownItem key="easy">Easy</DropdownItem>
            <DropdownItem key="medium">Medium</DropdownItem>
            <DropdownItem key="hard">Hard</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* Questions Table */}
      <div className="rounded-lg border border-default-200">
        <Table aria-label="Questions table">
          <TableHeader>
            <TableColumn
              className="cursor-pointer"
              onClick={() => handleSort("text")}
            >
              Question
              {sortField === "text" && (
                <span className="ml-1">
                  {sortDirection === "asc" ? "↑" : "↓"}
                </span>
              )}
            </TableColumn>
            <TableColumn
              className="cursor-pointer"
              onClick={() => handleSort("difficulty")}
            >
              Difficulty
              {sortField === "difficulty" && (
                <span className="ml-1">
                  {sortDirection === "asc" ? "↑" : "↓"}
                </span>
              )}
            </TableColumn>
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
                {searchQuery || difficultyFilter !== "all"
                  ? "No questions match your search criteria"
                  : "No questions available"}
              </div>
            }
          >
            {paginatedQuestions.map((question) => (
              <TableRow key={question._id}>
                <TableCell>
                  <div className="max-w-md">
                    <p className="text-sm font-medium">{question.text}</p>
                    {question.options && question.options.length > 0 && (
                      <div className="mt-1 text-xs text-default-500">
                        {question.options.map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span>{String.fromCharCode(65 + index)}.</span>
                            <span>{option}</span>
                            {index === question.correctAnswer && (
                              <Chip size="sm" color="success" variant="flat">
                                Correct
                              </Chip>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Chip
                    size="sm"
                    color={getDifficultyColor(question.difficulty)}
                    variant="flat"
                  >
                    {question.difficulty.charAt(0).toUpperCase() +
                      question.difficulty.slice(1)}
                  </Chip>
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