import React, { useCallback, useMemo, useState } from "react";
import { RoomMember } from "@/types/chat";
import MemberCellRenderer, { MemberColumnKey } from "./MemberCellRenderer";
import { SortDescriptor, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Pagination } from "@heroui/react";
import type { Selection } from "@react-types/shared";

export const COLUMNS = [
    { name: "USER", uid: "user", sortable: true },
    { name: "ROLE", uid: "role", sortable: true },
    { name: "ACTIONS", uid: "actions" },
];

export type TableColumnType = {
    uid: string;
    name: string;
    sortable?: boolean;
}

type MemberTableProps = {
    members: RoomMember[];
    currentUserId?: string;
    onBanMember: (member: RoomMember) => void;
    onMuteMember: (member: RoomMember) => void;
    onKickMember: (member: RoomMember) => void;
    roomId: string;
};

export default function MemberTable({
    members,
    currentUserId,
    onBanMember,
    onMuteMember,
    onKickMember,
    roomId,
}: MemberTableProps) {
    const [filterValue, setFilterValue] = useState("");
    const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
    const [page, setPage] = useState(1);
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: "user", direction: "ascending" });

    const handleSearch = (value: string) => {
        setFilterValue(value);
        setPage(1);
    };
    const handlePreviousPage = () => setPage((prev) => Math.max(1, prev - 1));
    const handleNextPage = () => setPage((prev) => prev + 1);

    const filteredItems = useMemo(() => {
        const query = filterValue.toLowerCase();
        return members.filter((member) =>
            member.username.toLowerCase().includes(query) ||
            (member.name?.first || "").toLowerCase().includes(query) ||
            (member.name?.last || "").toLowerCase().includes(query) ||
            (member.role?.name || "").toLowerCase().includes(query)
        );
    }, [members, filterValue]);

    const sortedItems = useMemo(() => {
        return [...filteredItems].sort((a, b) => {
            const first = a[sortDescriptor.column as keyof RoomMember] as any;
            const second = b[sortDescriptor.column as keyof RoomMember] as any;
            const cmp = first < second ? -1 : first > second ? 1 : 0;
            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [filteredItems, sortDescriptor]);

    const rowsPerPage = 10;
    const pagedItems = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        return sortedItems.slice(start, start + rowsPerPage);
    }, [sortedItems, page]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

    const renderCell = useCallback(
        (member: RoomMember, columnKey: MemberColumnKey) => {
            const isCurrentUser = member._id === currentUserId;
            return (
                <MemberCellRenderer
                    member={member}
                    columnKey={columnKey}
                    onBan={() => onBanMember(member)}
                    onMute={() => onMuteMember(member)}
                    onKick={() => onKickMember(member)}
                    isCurrentUser={isCurrentUser}
                    roomId={roomId}
                />
            );
        },
        [currentUserId, onBanMember, onMuteMember, onKickMember, roomId]
    );

    return (
        <div>
            <Table
                isHeaderSticky
                aria-label="Room members table"
                selectedKeys={selectedKeys}
                selectionMode="multiple"
                onSelectionChange={setSelectedKeys}
                sortDescriptor={sortDescriptor}
                onSortChange={setSortDescriptor}
            >
                <TableHeader columns={COLUMNS}>
                    {(column) => (
                        <TableColumn
                            key={column.uid}
                            align={column.uid === "actions" ? "center" : "start"}
                            className={`${column.uid} py-4 bg-default-50`}
                            allowsSorting={column.sortable}
                        >
                            <span className="text-bold text-small uppercase tracking-wider">{column.name}</span>
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody
                    emptyContent={
                        <div className="flex flex-col items-center justify-center py-8">
                            <span className="text-default-400">No members found</span>
                        </div>
                    }
                    items={pagedItems}
                >
                    {(item) => (
                        <TableRow key={item._id} className="hover:bg-default-50 transition-colors">
                            {(columnKey) => (
                                <TableCell className={`${columnKey.toString()} py-4`}>
                                    {renderCell(item, columnKey as MemberColumnKey)}
                                </TableCell>
                            )}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            
            {/* Pagination */}
            {pages > 1 && (
                <div className="flex justify-center mt-4">
                    <Pagination
                        total={pages}
                        page={page}
                        onChange={setPage}
                        showControls
                        color="primary"
                    />
                </div>
            )}
        </div>
    );
} 