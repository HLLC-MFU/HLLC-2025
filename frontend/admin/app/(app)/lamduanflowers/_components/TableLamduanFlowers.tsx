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
  SortDescriptor,
} from "@heroui/react";
import { Trash2, Search } from "lucide-react";

// mock data
const rows = [
  {
    key: "1",
    user: "6731701055",
    text: "👌✌👍(กุเป็นใบ้)",
    image: "https://i.pinimg.com/736x/4e/8a/6d/4e8a6da813ffe2337b5182587ebede35.jpg",
  },
  {
    key: "2",
    user: "6731804051",
    text: "กุก่ายฝนแต้ ตกหาป่อมึงนักนะ",
    image: "https://i.pinimg.com/736x/4e/8a/6d/4e8a6da813ffe2337b5182587ebede35.jpg",
  },
  {
    key: "3",
    user: "6731503888",
    text: "โถไอ้................เอ๋ย ไอ้ชาติคางคก ไอ้รกแผ่นดิน ไอ้ลิ้นสองแฉก ไอ้แหวกกอหญ้า ไอ้บ้าห้าร้อยจำพวก ไอ้ปลวกใต้หลังคา ไอ้หน้าปลาจวด ไอ้กรวดท้องร่อง ไอ้บ้องกัญชา ไอ้ปลาไม่กินเบ็ด ไอ้เห็ดสามสี ไอ้ชะนีสามรส ไอ้ตดเสียงดัง ไอ้ทั่งตีเหล็ก ไอ้เด็กปัญญาอ่อน ไอ้นอนเกา ไอ้กะโหลกซออู้ ไอ้กู่ไม่กลับ ไอ้ตับย่างเกลือ ไอ้เชื้ออหิวาต์ ไอ้ม้าขี้ครอก ไอ้หอกขึ้นสนิม ไอ้ขิมสายขาด ไอ้ชาติสุนัข ไอ้ตะหวักตะบวย ไอ้กล้วยตากแห้ง ไอ้แกงฟักทอง ไอ้คลองเจ็ดคด ไอ้ชะมดเช็ด ไอ้เกล็ดเต็มตัว ไอ้มั่วไม่รู้จบ ไอ้ศพขึ้นอืด ไอ้หืดขึ้นคอ ไอ้ปลาหมอแถกเหงือก ไอ้เผือกรมควัน ไอ้มันสำปะหลัง ไอ้โกดังเก็บศพ ไอ้กบผัดเผ็ด ไอ้เป็ดทอดกระเทียม ",
    image: "https://i.pinimg.com/736x/4e/8a/6d/4e8a6da813ffe2337b5182587ebede35.jpg",
  },
];

// column structure
const columns = [
  { key: "user", label: "User", sortable: true },
  { key: "text", label: "Text", sortable: true },
  { key: "image", label: "LamduanImage", sortable: false },
  { key: "action", label: "Actions", sortable: false },
];

export default function TableLamduanFlowers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "user",
    direction: "ascending",
  });

  const filteredItems = rows
    .filter(
      (item) =>
        item.user.includes(searchQuery) ||
        item.text.toLowerCase().includes(searchQuery.toLowerCase())
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

        <TableBody items={filteredItems}>
          {(item) => (
            <TableRow key={item.key}>
              {(columnKey) => {
                if (columnKey === "image") {
                  return (
                    <TableCell className="text-right">
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
                    <TableCell className="text-right">
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
