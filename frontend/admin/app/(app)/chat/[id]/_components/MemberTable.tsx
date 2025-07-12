"use client";

import React, { useCallback, Key, ReactNode, SetStateAction, useState, useMemo } from "react";
import {
  SortDescriptor,
} from "@heroui/react";

import TableContent from "./TableContent";
import { RestrictionAction } from "./RestrictionAction";
import { RestrictionStatusBadge } from "./RestrictionStatusBadge";
import { MemberActions } from "./MemberActions";

import { RoomMember } from "@/types/room";

type ModalProps = {
  restriction: boolean;
};

type ColumnProps = {
  name: string;
  uid: string;
  sortable?: boolean;
};

export default function MemberTable({
  roomId,
  members,
  modal,
  setModal,
  capitalize,
  columns,
  initialVisibleColumns,
  pagination,
  onPageChange,
}: {
  roomId: string;
  members: RoomMember[];
  modal: ModalProps;
  setModal: (value: SetStateAction<ModalProps>) => void;
  capitalize: (s: string) => string;
  columns: ColumnProps[];
  initialVisibleColumns: string[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
  onPageChange?: (page: number) => void;
}) {
  const [selectedMember, setSelectedMember] = useState<RoomMember | null>(null);
  const [restrictionAction, setRestrictionAction] = useState<'ban' | 'mute' | 'unban' | 'unmute' | 'kick'>('ban');
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<"all" | Set<string | number>>(
    new Set([])
  );
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(initialVisibleColumns)
  );
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "user",
    direction: "ascending" as "ascending" | "descending",
  });
  const [page, setPage] = useState(1);

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = useMemo(() => {
    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns, columns]);

  const filteredItems = useMemo(() => {
    let filteredMembers = [...members ?? []];

    if (hasSearchFilter) {
      filteredMembers = filteredMembers.filter((member) =>
        member.user.username.toLowerCase().includes(filterValue.toLowerCase()) ||
        `${member.user.name?.first || ""} ${member.user.name?.middle || ""} ${member.user.name?.last || ""}`.toLowerCase().includes(filterValue.toLowerCase()) ||
        member.user.Role?.name.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    return filteredMembers;
  }, [members, filterValue, hasSearchFilter]);

  const pages = pagination ? pagination.totalPages : Math.ceil(filteredItems.length / 10);

  const items = useMemo(() => {
    if (pagination) {
      return filteredItems;
    }
    const start = (page - 1) * 10;
    const end = start + 10;
    return filteredItems.slice(start, end);
  }, [page, filteredItems, pagination]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      let first: any, second: any;

      // Handle nested user structure for sorting
      switch (sortDescriptor.column) {
        case "username":
          first = a.user.username;
          second = b.user.username;
          break;
        case "role":
          first = a.user.Role?.name || "";
          second = b.user.Role?.name || "";
          break;
        default:
          // For other cases, try to access directly or from user object
          first = a[sortDescriptor.column as keyof RoomMember] || a.user[sortDescriptor.column as keyof typeof a.user];
          second = b[sortDescriptor.column as keyof RoomMember] || b.user[sortDescriptor.column as keyof typeof b.user];
      }

      if (first === undefined && second === undefined) return 0;
      if (first === undefined) return sortDescriptor.direction === "descending" ? 1 : -1;
      if (second === undefined) return sortDescriptor.direction === "descending" ? -1 : 1;

      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const handleRestrictionAction = (member: RoomMember, action: 'ban' | 'mute' | 'unban' | 'unmute' | 'kick') => {
    setSelectedMember(member);
    setRestrictionAction(action);
    setModal(prev => ({ ...prev, restriction: true }));
  };

  const handleActionSuccess = () => {
    if (onPageChange && pagination) {
      onPageChange(pagination.page);
    }
    setModal(prev => ({ ...prev, restriction: false }));
  };

  const renderCell = useCallback(
    (item: RoomMember, columnKey: Key) => {
      const cellValue = item[columnKey as keyof typeof item];

      switch (columnKey) {
        case "user":
          const name = [item.user.name?.first, item.user.name?.middle, item.user.name?.last].filter(Boolean).join(" ") || item.user.username || "Unknown";
          return (
            <div className="flex items-center gap-3 min-w-[200px]">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-small">{item.user.username}</span>
                <span className="text-tiny text-default-500">{name}</span>
                <RestrictionStatusBadge restrictionStatus={item.restrictionStatus} />
              </div>
            </div>
          );
        case "role":
          return (
            <div className="flex items-center min-w-[120px]">
              <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                {item.user.Role?.name || "Member"}
              </span>
            </div>
          );
        case "actions":
          return (
            <div className="flex justify-end">
              <MemberActions 
                member={item} 
                onAction={handleRestrictionAction} 
              />
            </div>
          );
        default:
          if (typeof cellValue === "object" && cellValue !== null) {
            return JSON.stringify(cellValue);
          }
          return cellValue as ReactNode;
      }
    },
    [handleRestrictionAction]
  );

  return (
    <div>
      <TableContent
        capitalize={capitalize}
        columns={columns}
        filterValue={filterValue}
        filteredItems={filteredItems}
        headerColumns={headerColumns}
        page={pagination ? pagination.page : page}
        pages={pages}
        renderCell={renderCell}
        selectedKeys={selectedKeys}
        setModal={setModal}
        setPage={setPage}
        setSelectedKeys={setSelectedKeys}
        setSortDescriptor={setSortDescriptor}
        setVisibleColumns={setVisibleColumns}
        sortDescriptor={sortDescriptor}
        sortedItems={sortedItems}
        visibleColumns={visibleColumns}
        onClear={() => {
          setFilterValue("");
          setPage(1);
        }}
        onNextPage={() => {
          if (pagination && onPageChange) {
            onPageChange(pagination.page + 1);
          } else {
            setPage((p) => p + 1);
          }
        }}
        onPreviousPage={() => {
          if (pagination && onPageChange) {
            onPageChange(pagination.page - 1);
          } else {
            setPage((p) => Math.max(1, p - 1));
          }
        }}
        onSearchChange={(val: string) => {
          setFilterValue(val);
          setPage(1);
        }}
        pagination={pagination}
        onPageChange={onPageChange}
      />

      <RestrictionAction
        action={restrictionAction}
        isOpen={modal.restriction}
        member={selectedMember}
        roomId={roomId}
        onClose={() => setModal(prev => ({ ...prev, restriction: false }))}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
} 