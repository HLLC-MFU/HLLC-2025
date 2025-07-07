import type { Selection } from "@react-types/shared";

import React, { useCallback, useMemo, useState } from "react";
import { SortDescriptor, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Pagination } from "@heroui/react";

import MemberCellRenderer, { MemberColumnKey } from "./MemberCellRenderer";

import { RoomMember } from "@/types/chat";

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
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    } | null;
    onPageChange?: (page: number) => void;
    loading?: boolean;
};3

export default function MemberTable({
    members,
    currentUserId,
    onBanMember,
    onMuteMember,
    roomId,
    pagination,
    onPageChange,
    loading = false,
}: MemberTableProps) {
    const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: "user", direction: "ascending" });

    // Ensure members is always an array and filter out invalid items
    const validMembers = useMemo(() => {
        if (!Array.isArray(members)) {
            console.warn('MemberTable: members is not an array:', members);

            return [];
        }
        const filtered = members.filter(member => member && (member._id || member.username));

        if (filtered.length !== members.length) {
            console.warn('MemberTable: filtered out invalid members:', members.length - filtered.length);
        }

        return filtered;
    }, [members]);

    const filteredItems = useMemo(() => {
        return validMembers;
    }, [validMembers]);

    const sortedItems = useMemo(() => {
        return [...filteredItems].sort((a, b) => {
            const first = a[sortDescriptor.column as keyof RoomMember] as any;
            const second = b[sortDescriptor.column as keyof RoomMember] as any;
            const cmp = first < second ? -1 : first > second ? 1 : 0;

            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [filteredItems, sortDescriptor]);

    const renderCell = useCallback(
        (member: RoomMember, columnKey: MemberColumnKey) => {
            const isCurrentUser = member._id === currentUserId;

            return (
                <MemberCellRenderer
                    columnKey={columnKey}
                    isCurrentUser={isCurrentUser}
                    member={member}
                    onBan={() => onBanMember(member)}
                    onMute={() => onMuteMember(member)}
                />
            );
        },
        [currentUserId, onBanMember, onMuteMember, roomId]
    );

    return (
        <div>
            <Table
                isHeaderSticky
                aria-label="Room members table"
                selectedKeys={selectedKeys}
                selectionMode="multiple"
                sortDescriptor={sortDescriptor}
                onSelectionChange={setSelectedKeys}
                onSortChange={setSortDescriptor}
            >
                <TableHeader columns={COLUMNS}>
                    {(column) => (
                        <TableColumn
                            key={column.uid}
                            align={column.uid === "actions" ? "center" : "start"}
                            allowsSorting={column.sortable}
                            className={`${column.uid} py-4 bg-default-50`}
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
                    items={sortedItems}
                >
                    {(item) => (
                        <TableRow key={item._id || `member-${item.username || Math.random()}`} className="hover:bg-default-50 transition-colors">
                            {(columnKey) => (
                                <TableCell className={`${columnKey.toString()} py-4`}>
                                    {renderCell(item, columnKey as MemberColumnKey)}
                                </TableCell>
                            )}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            
            {/* Server-side Pagination */}
            {pagination && pagination.totalPages > 1 && onPageChange && (
                <div className="flex justify-center mt-4">
                    <Pagination
                        showControls
                        showShadow
                        color="primary"
                        page={pagination.page}
                        total={pagination.totalPages}
                        onChange={onPageChange}
                    />
                </div>
            )}
        </div>
    );
} 