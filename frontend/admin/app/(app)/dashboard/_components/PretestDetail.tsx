"use client";
import { usePretestDetail } from "@/hooks/usePretestDetail";
import {
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Button,
  Input,
} from "@heroui/react";
import { FileText, RefreshCcw, Search } from "lucide-react";
import React, { useEffect } from "react";

export default function PretestDetail() {
  const {
    fetchPretestDetail,
    averageData,
    totalAnswers,
    userAnswers,
    isLoading,
  } = usePretestDetail();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [page, setPage] = React.useState(1);
  const rowsPerPage = 10;

  const users = userAnswers()
    .filter((user) =>
      `${user.username} ${user.name.first} ${user.name.last}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.username.localeCompare(b.username));

  const maxAnswersCount = users.length
    ? Math.max(...users.map((user) => user.answers.length))
    : 0;
  const pages = Math.ceil(users.length / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return users.slice(start, end);
  }, [page, users]);

  useEffect(() => {
    fetchPretestDetail();
  }, [fetchPretestDetail]);

  const handleExportCSV = () => {
    if (isLoading || users.length === 0) return;

    // Column headers using question text
    const headers = [
      "User",
      ...[...Array(maxAnswersCount)].map((_, i) => {
        const question = averageData[i]?.question?.en || `Q${i + 1}`;
        return `"${question.replace(/"/g, '""')}"`;
      }),
    ];

    const csvRows = users.map((user) => {
      const name = `${user.username} - ${user.name.first} ${user.name.last}`;
      const answers = [...Array(maxAnswersCount)].map((_, i) => {
        const ans = user.answers[i]?.answer ?? "";
        return `"${ans.replace(/"/g, '""')}"`;
      });
      return [name, ...answers].join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([`\uFEFF`+csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "pretest_answers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-8">
      {/* Top Controls */}
      <div className="flex justify-between items-center gap-4">
        <Input
          placeholder="Search user..."
          variant="faded"
          color="primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          startContent={<Search className="w-4 h-4" />}
          className="max-w-xs"
          isClearable
        />
        <div className="flex gap-2">
          <Button
            onPress={handleExportCSV}
            color="secondary"
            variant="bordered"
            isDisabled={isLoading || users.length === 0}
          >
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Export CSV
            </span>
          </Button>
          <Button
            onPress={fetchPretestDetail}
            disabled={isLoading}
            color="primary"
            isLoading={isLoading}
          >
            {isLoading ? (
              "Loading..."
            ) : (
              <>
                <RefreshCcw className="w-4 h-4 mr-1" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Average Scores Table */}
      <div>
        <Table className="w-full">
          <TableHeader className="bg-gray-100">
            <TableColumn className="px-4 py-2 text-left">Question</TableColumn>
            <TableColumn className="px-4 py-2 text-right">Average</TableColumn>
          </TableHeader>
          <TableBody>
            {isLoading
              ? [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-4 py-2">
                      <div className="h-4 w-24 bg-gray-300 rounded animate-pulse" />
                    </TableCell>
                    <TableCell className="px-4 py-2 text-right">
                      <div className="h-4 w-12 bg-gray-300 rounded animate-pulse mx-auto" />
                    </TableCell>
                  </TableRow>
                ))
              : averageData.map((avg) => (
                  <TableRow key={avg.questionId}>
                    <TableCell className="px-4 py-2">
                      {avg.question.en}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-right">
                      {avg.average.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* User Answers Table */}
      <div>
        <Table
          className="w-full"
          aria-label="User answers table"
          bottomContent={
            <div className="flex w-full justify-center">
              <Pagination
                isCompact
                showControls
                showShadow
                color="secondary"
                page={page}
                total={pages}
                onChange={(page) => setPage(page)}
                isDisabled={isLoading}
              />
            </div>
          }
        >
          <TableHeader className="bg-gray-50">
            <TableColumn className="px-3 py-1 text-left flex-1">User</TableColumn>
            {[...Array(maxAnswersCount)].map((_, i) => (
              <TableColumn key={i} className="px-3 py-1 text-left">
                { ` `}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading
              ? [...Array(rowsPerPage)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-3 py-1 font-medium flex-1">
                    <div className="h-4 w-24 bg-gray-300 rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
              : items.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell className="px-3 py-1 font-medium flex-1">
                      {user.username} - {user.name.first} {user.name.last}
                    </TableCell>
                    {[...Array(maxAnswersCount)].map((_, i) => (
                      <TableCell key={i} className="px-3 py-1">
                        {user.answers[i]?.answer ?? ""}
                      </TableCell>
                    ))}
                  </>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Total Answer Count */}
      <p className="mt-2 text-sm text-gray-600">
        {isLoading ? (
          <div className="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
        ) : (
          <div className="w-full flex-end">Total Answers: {totalAnswers}</div>
        )}
      </p>
    </div>
  );
}
