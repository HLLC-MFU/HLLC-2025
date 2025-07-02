'use client';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination } from "@heroui/react";
import { useState } from "react";

interface User {
  rank: number;
  id: string;
  name: string;
  school: string;
  major: string;
  steps: number;
}

interface Props {
  users: User[];
}

export default function StepcontersUserTable({ users }: Props) {
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(users.length / rowsPerPage);

  const paginatedUsers = users.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="mt-6">
      <Table aria-label="User leaderboard">
        <TableHeader>
          <TableColumn>RANK</TableColumn>
          <TableColumn>ID</TableColumn>
          <TableColumn>NAME</TableColumn>
          <TableColumn>SCHOOLS</TableColumn>
          <TableColumn>MAJORS</TableColumn>
          <TableColumn>STEPS</TableColumn>
        </TableHeader>
        <TableBody>
          {paginatedUsers.map((user) => (
            <TableRow key={user.rank}>
              <TableCell>{user.rank}</TableCell>
              <TableCell>{user.id}</TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.school}</TableCell>
              <TableCell>{user.major}</TableCell>
              <TableCell>{user.steps}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-center mt-4">
        <Pagination page={page} total={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}
