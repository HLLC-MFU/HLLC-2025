import React, { Key, useCallback, useMemo, useState } from "react";
import { SortDescriptor, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Spinner } from "@heroui/react";
import TopContent from "./TopContent";
import BottomContent from "./BottomContent";
import LandmarkCellRenderer from "./LandmarkCellRenderer";
import { Landmark } from "@/types/landmark";

const COLUMNS = [
    { name: "NAME", uid: "name" },
    { name: "HINT", uid: "hint" },
    { name: "ORDER", uid: "order" },
    { name: "TYPE", uid: "type" },
    { name: "LOCATION", uid: "location" },
    { name: "MAP", uid: "mapCoordinate" },
    { name: "COOLDOWN", uid: "cooldown" },
    { name: "LIMIT DIST.", uid: "limitDistance" },
    { name: "HINT IMG", uid: "hintImage" },
    { name: "COIN IMG", uid: "coinImage" },
    { name: "ACTIONS", uid: "actions" },
];

type LandmarkTableProps = {
    landmarks: Landmark[];
    loading?: boolean;
    onAdd: () => void;
    onEdit: (landmark: Landmark) => void;
    onDelete: (landmark: Landmark) => void;
};

export default function LandmarkTable({
    landmarks,
    loading,
    onAdd,
    onEdit,
    onDelete,
}: LandmarkTableProps) {
    const [filterValue, setFilterValue] = useState("");
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "order",
        direction: "ascending"
    });
    const [page, setPage] = useState(1);
    const rowsPerPage = 5;

    const handleSearch = (value: string) => {
        setFilterValue(value);
        setPage(1);
    };

    const handleClear = () => {
        setFilterValue("");
        setPage(1);
    };

    const filteredItems = useMemo(() => {
        let filtered = [...(landmarks ?? [])];
        const query = filterValue.toLowerCase();
        if (!!filterValue) {
            filtered = landmarks.filter(
                (landmark) =>
                    landmark.name.en.toLowerCase().includes(query) ||
                    landmark.name.th.toLowerCase().includes(query) ||
                    landmark.hint.en.toLowerCase().includes(query) ||
                    landmark.hint.th.toLowerCase().includes(query) ||
                    landmark.order.toString().toLowerCase().includes(query) ||
                    landmark.type.toLowerCase().includes(query)
            );
        }
        return filtered;
    }, [landmarks, filterValue]);

    const landmarkItems = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredItems.slice(start, end);
    }, [page, filteredItems, sortDescriptor]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

    const renderCell = useCallback(
        (landmark: Landmark, columnKey: Key) => {
            return (
                <LandmarkCellRenderer
                    landmark={landmark}
                    columnKey={columnKey}
                    onEdit={() => onEdit(landmark)}
                    onDelete={() => onDelete(landmark)}
                />
            );
        },
        [landmarks]
    );

    return (
        <Table
            isHeaderSticky
            aria-label="Landmark Table"
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            topContentPlacement="outside"
            topContent={
                <TopContent
                    filterValue={filterValue}
                    onClear={handleClear}
                    onSearchChange={handleSearch}
                    onAdd={onAdd}
                />
            }
            bottomContentPlacement="outside"
            bottomContent={
                <BottomContent
                    page={page}
                    pages={pages}
                    setPage={setPage}
                />
            }
        >
            <TableHeader columns={COLUMNS}>
                {(column) => (
                    <TableColumn
                        key={column.uid}
                        align={column.uid === "actions" ? "center" : "start"}
                    >
                        {column.name}
                    </TableColumn>
                )}
            </TableHeader>
            <TableBody
                emptyContent={
                    loading ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Spinner size="lg" />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8">
                            <span className="text-default-400">No landmarks found</span>
                        </div>
                    )
                }
                items={[...landmarkItems]}
            >
                {(landmark: Landmark) => (
                    <TableRow
                        key={landmark._id}
                        className="hover:bg-default-50 transition-colors"
                    >
                        {(columnKey) => (
                            <TableCell className={`${columnKey.toString()} py-4`}>
                                {renderCell(landmark, columnKey)}
                            </TableCell>
                        )}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
} 