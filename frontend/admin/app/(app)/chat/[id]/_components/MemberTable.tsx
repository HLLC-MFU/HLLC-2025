"use client";

import React, { useCallback, Key, ReactNode, SetStateAction, useState, useMemo } from "react";
import {
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  addToast,
  SortDescriptor,
} from "@heroui/react";
import { EllipsisVertical, Ban, MicOff, LogOut } from "lucide-react";

import TableContent from "./TableContent";
import { RestrictionAction } from "./RestrictionAction";

import { RoomMember } from "@/types/chat";

type ModalProps = {
  restriction: boolean;
};

type ColumnProps = {
  name: string;
  uid: string;
  sortable: boolean;
} | {
  name: string;
  uid: string;
  sortable?: undefined;
};

export default function MemberTable({
  roomId,
  members,
  modal,
  setModal,
  capitalize,
  columns,
  initialVisibleColumns,
  onBanMember,
  onMuteMember,
  onKickMember,
  pagination,
  onPageChange,
  loading = false,
}: {
  roomId: string;
  members: RoomMember[];
  modal: ModalProps;
  setModal: (value: SetStateAction<ModalProps>) => void;
  capitalize: (s: string) => string;
  columns: ColumnProps[];
  initialVisibleColumns: string[];
  onBanMember: (member: RoomMember) => void;
  onMuteMember: (member: RoomMember) => void;
  onKickMember: (member: RoomMember) => void;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
  onPageChange?: (page: number) => void;
  loading?: boolean;
}) {
  const [selectedMember, setSelectedMember] = useState<RoomMember | null>(null);
  const [restrictionAction, setRestrictionAction] = useState<'ban' | 'mute' | 'kick'>('ban');
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<"all" | Set<string | number>>(
    new Set([])
  );
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(initialVisibleColumns)
  );
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "username",
    direction: "ascending" as "ascending" | "descending",
  });
  const [page, setPage] = useState(1);

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = useMemo(() => {
    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  const filteredItems = useMemo(() => {
    let filteredMembers = [...members ?? []];

    if (hasSearchFilter) {
      filteredMembers = filteredMembers.filter((member) =>
        member.username.toLowerCase().includes(filterValue.toLowerCase()) ||
        `${member.name?.first || ""} ${member.name?.middle || ""} ${member.name?.last || ""}`.toLowerCase().includes(filterValue.toLowerCase()) ||
        member.role?.name.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    return filteredMembers;
  }, [members, filterValue]);

  const pages = pagination ? pagination.totalPages : Math.ceil(filteredItems.length / rowsPerPage);

  const items = useMemo(() => {
    if (pagination) {
      return filteredItems;
    }
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage, pagination]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof RoomMember];
      const second = b[sortDescriptor.column as keyof RoomMember];

      if (first === undefined && second === undefined) return 0;
      if (first === undefined) return sortDescriptor.direction === "descending" ? 1 : -1;
      if (second === undefined) return sortDescriptor.direction === "descending" ? -1 : 1;

      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const handleRestrictionAction = (member: RoomMember, action: 'ban' | 'mute' | 'kick') => {
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
          const name = [item.name?.first, item.name?.middle, item.name?.last].filter(Boolean).join(" ") || item.username || "Unknown";
          return (
            <div className="flex items-center gap-3 min-w-[200px]">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-small">{item.username}</span>
                <span className="text-tiny text-default-500">{name}</span>
              </div>
            </div>
          );
        case "role":
          return (
            <div className="flex items-center min-w-[120px]">
              <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                {item.role?.name || "Member"}
              </span>
            </div>
          );
        case "actions":
          return (
            <div className="relative flex justify-end items-center gap-2">
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly size="sm" variant="light">
                    <EllipsisVertical className="text-default-300" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu>
                  <DropdownItem
                    key="ban"
                    startContent={<Ban size="16px" />}
                    className="text-danger"
                    color="danger"
                    onPress={() => handleRestrictionAction(item, 'ban')}
                  >
                    Ban User
                  </DropdownItem>
                  <DropdownItem
                    key="mute"
                    startContent={<MicOff size="16px" />}
                    className="text-warning"
                    color="warning"
                    onPress={() => handleRestrictionAction(item, 'mute')}
                  >
                    Mute User
                  </DropdownItem>
                  <DropdownItem
                    key="kick"
                    startContent={<LogOut size="16px" />}
                    className="text-danger"
                    color="danger"
                    onPress={() => handleRestrictionAction(item, 'kick')}
                  >
                    Kick User
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          );
        default:
          if (typeof cellValue === "object" && cellValue !== null) {
            return JSON.stringify(cellValue);
          }
          return cellValue as ReactNode;
      }
    },
    [page, selectedKeys]
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
        loading={loading}
      />

      {/* Restriction Action Modal */}
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