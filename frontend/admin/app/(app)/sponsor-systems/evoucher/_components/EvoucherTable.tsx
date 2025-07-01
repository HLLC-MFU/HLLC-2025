// import React, { useCallback, useMemo, useState } from "react";
// import { Evoucher, EvoucherType } from "@/types/evoucher";
// import EvoucherCellRenderer, { EvoucherColumnKey } from "./EvoucherCellRenderer";
// import { SortDescriptor, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
// import TopContent from "./TopContent";
// import BottomContent from "./BottomContent";
// import type { Selection } from "@react-types/shared";

// export const COLUMNS = [
//     { name: "SPONSOR", uid: "sponsors", sortable: true },
//     { name: "ACRONYM", uid: "acronym", sortable: true },
//     { name: "DETAIL", uid: "detail" },
//     { name: "DISCOUNT", uid: "discount", sortable: true },
//     { name: "EXPIRATION", uid: "expiration", sortable: true },
//     { name: "STATUS", uid: "status", sortable: true },
//     { name: "CLAIMS", uid: "claims" },
//     { name: "COVER", uid: "cover" },
//     { name: "ACTIONS", uid: "actions" },
// ];

// export type TableColumnType = {
//     uid: string;
//     name: string;
//     sortable?: boolean;
// }

// type EvoucherTableProps = {
//     sponsorName: string;
//     evouchers: Evoucher[];
//     evoucherType: EvoucherType;
//     onAdd: () => void;
//     onEdit: (evoucher: Evoucher) => void;
//     onDelete: (evoucher: Evoucher) => void;
// };

// export default function EvoucherTable({
//     evouchers,
//     onAdd,
//     onEdit,
//     onDelete,
// }: EvoucherTableProps) {
//     const [filterValue, setFilterValue] = useState("");
//     const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
//     const [page, setPage] = useState(1);
//     const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: "acronym", direction: "ascending" });
//     const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

//     const handleSearch = (value: string) => {
//         setFilterValue(value);
//         setPage(1);
//     };

//     const handleClear = () => {
//         setFilterValue("");
//         setPage(1);
//     };

//     const handlePreviousPage = () => setPage((prev) => Math.max(1, prev - 1));
//     const handleNextPage = () => setPage((prev) => prev + 1);

//     const filteredItems = useMemo(() => {
//         const query = filterValue.toLowerCase();
//         return evouchers.filter((evoucher) =>
//             evoucher.sponsors.name.en.toLowerCase().includes(query) ||
//             evoucher.discount.toString().includes(query) ||
//             evoucher.acronym.toLowerCase().includes(query) ||
//             evoucher.detail.en.toLowerCase().includes(query) ||
//             evoucher.expiration.toString().includes(query)
//         );
//     }, [evouchers, filterValue]);

//     const sortedItems = useMemo(() => {
//         return [...filteredItems].sort((a, b) => {
//             const first = a[sortDescriptor.column as keyof Evoucher] as any;
//             const second = b[sortDescriptor.column as keyof Evoucher] as any;
//             const cmp = first < second ? -1 : first > second ? 1 : 0;
//             return sortDescriptor.direction === "descending" ? -cmp : cmp;
//         });
//     }, [filteredItems, sortDescriptor]);

//     const rowsPerPage = 5;
//     const pagedItems = useMemo(() => {
//         const start = (page - 1) * rowsPerPage;
//         return sortedItems.slice(start, start + rowsPerPage);
//     }, [sortedItems, page]);

//     const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

//     const renderCell = useCallback(
//         (evoucher: Evoucher, columnKey: EvoucherColumnKey) => {
//             return (
//                 <EvoucherCellRenderer
//                     evoucher={evoucher}
//                     columnKey={columnKey}
//                     onEdit={() => onEdit(evoucher)}
//                     onDelete={() => onDelete(evoucher)}
//                 />
//             );
//         },
//         [onEdit, onDelete]
//     );

//     return (
//         <Table
//             isHeaderSticky
//             aria-label="Table header"

//             topContent={
//                 <TopContent
//                     setActionText={onAdd}
//                     filterValue={filterValue}
//                     capitalize={capitalize}
//                     onClear={handleClear}
//                     onSearchChange={handleSearch}
//                     filteredItems={filteredItems}
//                     page={page}
//                     pages={pages}
//                     setPage={setPage}
//                     onPreviousPage={handlePreviousPage}
//                     onNextPage={handleNextPage}
//                 />
//             }
//             topContentPlacement="outside"
//             selectedKeys={selectedKeys}
//             onSelectionChange={setSelectedKeys}
//             sortDescriptor={sortDescriptor}
//             onSortChange={setSortDescriptor}
//             bottomContentPlacement="outside"
//             bottomContent={
//                 <BottomContent
//                     page={page}
//                     pages={pages}
//                     setPage={setPage}
//                 />
//             }
//         >
//             <TableHeader columns={COLUMNS}>
//                 {(column) => (
//                     <TableColumn
//                         key={column.uid}
//                         align={column.uid === "actions" ? "center" : "start"}
//                         allowsSorting={column.sortable}
//                     >
//                         {column.name}
//                     </TableColumn>
//                 )}
//             </TableHeader>
//             <TableBody
//                 emptyContent={
//                     <div className="flex flex-col items-center justify-center py-8">
//                         <span className="text-default-400">No evouchers found</span>
//                     </div>
//                 }
//                 items={pagedItems}
//             >
//                 {(item) => (
//                     <TableRow key={item._id} className="hover:bg-default-50 transition-colors">
//                         {(columnKey) => (
//                             <TableCell className={`${columnKey.toString()} py-4`}>
//                                 {renderCell(item, columnKey as EvoucherColumnKey)}
//                             </TableCell>
//                         )}
//                     </TableRow>
//                 )}
//             </TableBody>
//         </Table>
//     );
// }
