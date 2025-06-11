import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
  Button,
  Input,
} from "@heroui/react";
import { Trash2, Search } from "lucide-react";

// mock data
const rows = [
  {
    key: "1",
    user: "6731701055",
    text: "👌✌👍",
    image: "https://via.placeholder.com/80x80?text=Lamduan1",
  },
  {
    key: "2",
    user: "6731804051",
    text: "ขอบคุณที่ตั้งใจเรียนจบจนเป็นผู้ใหญ่เต็มตัวแล้วนะหลังจากนี้ใช้ชีวิตให้ดี ดูแลครอบครัวได้นะ",
    image: "https://via.placeholder.com/80x80?text=Lamduan2",
  },
];

// column structure
const columns = [
  { key: "user", label: "User" },
  { key: "text", label: "Text" },
  { key: "image", label: "LamduanImage" },
  { key: "action", label: "Actions" },
];

export default function TableLamduanFlowers() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = rows.filter(
    (item) =>
      item.user.includes(searchQuery) ||
      item.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      {/* search bar */}
      <div className="flex justify-end">
        <Input
          placeholder="Search"
          startContent={<Search className="text-default-400" />}
          value={searchQuery}
          onValueChange={setSearchQuery}
          className="max-w-xs"
        />
      </div>

      {/* table */}
      <Table aria-label="Manage Lamduan Table">
        <TableHeader columns={columns}>
          {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
        </TableHeader>

        <TableBody items={filteredItems}>
          {(item) => (
            <TableRow key={item.key}>
              {(columnKey) => {
                if (columnKey === "image") {
                  return (
                    <TableCell>
                      <img
                        src={item.image}
                        alt="Lamduan"
                        className="w-[60px] h-[60px] object-cover rounded"
                      />
                    </TableCell>
                  );
                }

                if (columnKey === "action") {
                  return (
                    <TableCell>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => alert(`Delete ${item.user}`)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  );
                }

                return (
                  <TableCell className="py-4 px-2">
                    {getKeyValue(item, columnKey)}
                  </TableCell>
                );
              }}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
