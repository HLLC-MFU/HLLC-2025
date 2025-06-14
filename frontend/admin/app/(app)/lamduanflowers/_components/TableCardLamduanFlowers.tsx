import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  SortDescriptor,
  Card,
  CardBody,
  Image,
  Button
} from "@heroui/react";
import { Trash2, Search } from "lucide-react";

// mock data
const rows = [
  {
    key: "1",
    user: "6731701055",
    comment: "👌✌👍",
    image: "https://i.pinimg.com/736x/4e/8a/6d/4e8a6da813ffe2337b5182587ebede35.jpg",
  },
  {
    key: "2",
    user: "6731804051",
    comment: "ขอบคุณที่ตั้งใจเรียนจนจบ เป็นผู้ใหญ่เต็มตัวแล้วนะหลังจากนี้ก็ใช้ชีวิตให้ดี ดูแลครอบครัวได้แล้วนะ",
    image: "https://i.pinimg.com/736x/4e/8a/6d/4e8a6da813ffe2337b5182587ebede35.jpg",
  },
  {
    key: "3",
    user: "6731503888",
    comment: "สวัสดี",
    image: "https://i.pinimg.com/736x/4e/8a/6d/4e8a6da813ffe2337b5182587ebede35.jpg",
  },
];

// column structure
const columns = [
  { key: "user", label: "User", sortable: true },
  { key: "comment", label: "Comment", sortable: true },
  { key: "image", label: "LamduanImage", sortable: false },
  { key: "action", label: "Actions", sortable: false },
];

export default function TableCardLamduanFlowers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "user",
    direction: "ascending",
  });

  const filteredItems = rows
    .filter(
      (item) =>
        item.user.includes(searchQuery) ||
        item.comment.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const { column, direction } = sortDescriptor;
      if (!column || column === "image" || column === "action") return 0;

      const first = a[column as keyof typeof a] ?? "";
      const second = b[column as keyof typeof b] ?? "";
      const cmp =
        typeof first === "string" && typeof second === "string"
          ? first.localeCompare(second)
          : 0;
      return direction === "ascending" ? cmp : -cmp;
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Input
          placeholder="Search"
          startContent={<Search className="text-default-400" />}
          value={searchQuery}
          onValueChange={setSearchQuery}
          className="max-w-full"
        />
      </div>

      <Table
        aria-label="Manage Lamduan Table"
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.key}
              allowsSorting={column.sortable}
              className={["image", "action"].includes(column.key) ? "text-right" : ""}
              style={{
                width: column.key === "image" ? "80px" : column.key === "action" ? "80px" : "auto",
              }}
            >
              {column.label}
            </TableColumn>
          )}
        </TableHeader>

        <TableBody>
          {filteredItems.map((item) => (
            <TableRow key={item.key}>
              <TableCell colSpan={4}>
                <Card
                  isBlurred
                  className="border-none bg-background/60 dark:bg-default-100/50 max-w-full rounded-xl overflow-hidden"
                  shadow="sm"
                >
                  <div className="flex">
                    <div className="p-2">
                      <Image
                        alt="lamduan"
                        className="object-cover w-[90px] h-[90px] rounded-lg"
                        shadow="md"
                        src={item.image}
                      />
                    </div>

                    <div className="flex flex-col justify-center gap-1 px-2 flex-1">
                      <p className="text-lg font-bold">{item.user}</p>
                      <p className="text-sm font-medium">Comment: {item.comment}</p>
                    </div>

                    <div className="w-[60px] flex items-center justify-center">
                      <Button isIconOnly variant="light" color="danger">
                        <Trash2 size={20} />
                      </Button>
                    </div>
                  </div>
                </Card>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
