import {
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Table,
    SortDescriptor,
} from "@heroui/react";
import { Activities } from "@/types/activities";
import ActivitiesCellRenderer, {
    ActivitiesColumnKey,
} from "./ActivitiesCellRenderer";
import TopContent from "./TopContent";
import { useState } from "react";
import React from "react";

type ActivitiesTableProps = {
    activities: Activities[];
    onAdd: () => void;
    onEdit: (activity: Activities) => void;
    onDelete: (activity: Activities) => void;
    onViewDetail: (activity: Activities) => void;
};

export const columns = [
    { uid: "acronym", name: "Acronym" },
    { uid: "name", name: "Name" },
    { uid: "location", name: "Location" },
    { uid: "startAt", name: "Start At" },
    { uid: "endAt", name: "End At" },
    { uid: "isOpen", name: "Status" },
    { uid: "isVisible", name: "Show" },
    { uid: "isProgressCount", name: "isProgressCount" },
    { uid: "actions", name: "Actions" },
];

export default function ActivitiesTable({
    activities,
    onAdd,
    onEdit,
    onDelete,
    onViewDetail,
}: ActivitiesTableProps) {
    const [selectedColor, setSelectedColor] = useState<"default">("default");
    const [filterValue, setFilterValue] = useState("");
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "acronym",
        direction: "ascending",
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

    return (
        <Table
            color={selectedColor}
            defaultSelectedKeys={["2"]}
            selectionMode="single"
            aria-label="Activities table">
            <TableHeader columns={columns}>
                {(column) => (
                    <TableColumn
                        key={column.uid}
                        align={column.uid === "actions" ? "center" : "start"}
                    >
                        {column.name}
                    </TableColumn>
                )}
            </TableHeader>
            <TableBody>
                {activities.map((activity) => (
                    <TableRow key={activity._id}>
                        {columns.map((column) => (
                            <TableCell key={column.uid}>
                                <ActivitiesCellRenderer
                                    activity={activity}
                                    columnKey={column.uid as ActivitiesColumnKey}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onViewDetail={onViewDetail}
                                />
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
