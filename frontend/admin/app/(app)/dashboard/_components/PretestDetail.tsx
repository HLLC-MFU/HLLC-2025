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
} from "@heroui/react";
import { RefreshCcw } from "lucide-react";
import React, { useEffect } from "react";

export default function PretestDetail() {
  const { fetchPretestDetail, averageData, totalAnswers, userAnswers, isLoading } =
    usePretestDetail();

  const users = userAnswers().sort((a, b) =>
    a.name.first.localeCompare(b.name.first)
  );
  const maxAnswersCount = users.length
    ? Math.max(...users.map((user) => user.answers.length))
    : 0;
  const rowsPerPage = 10;
  const [page, setPage] = React.useState(1);
  const pages = Math.ceil(users.length / rowsPerPage);
  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return users.slice(start, end);
  }, [page, users]);

  useEffect(() => {
    fetchPretestDetail();
  }, [fetchPretestDetail]);

  return (
    <div className="w-full space-y-8">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          onPress={fetchPretestDetail}
          disabled={isLoading}
          color="primary"
          isLoading={isLoading}
        >
          {isLoading ? "Loading..." : <>
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </>}
        </Button>
      </div>

      {/* Average Scores */}
      <div>
        <Table className="w-full">
          <TableHeader className="bg-gray-100">
            <TableColumn className="px-4 py-2 text-left">Question</TableColumn>
            <TableColumn className="px-4 py-2 text-right">Average</TableColumn>
          </TableHeader>
          <TableBody>
            {isLoading
              ? // Skeleton rows, e.g. 3 rows
              [...Array(3)].map((_, i) => (
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
                  <TableCell className="px-4 py-2">{avg.question.en}</TableCell>
                  <TableCell className="px-4 py-2 text-right">
                    {avg.average.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

      </div>

      {/* User Answers */}
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
            <>
              {[...Array(maxAnswersCount)].map((_, i) => (
                <TableColumn key={i} className="px-3 py-1 text-left">
                  {`${i + 1}`}
                </TableColumn>
              ))}
            </>
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
                    {user.name.first} {user.name.last}
                  </TableCell>
                  <>
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
      {isLoading ? (
        <div className="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
      ) : (
        <p className="mt-2 text-sm text-gray-600">Total Answers: {totalAnswers}</p>
      )}
    </div>
  );
}
