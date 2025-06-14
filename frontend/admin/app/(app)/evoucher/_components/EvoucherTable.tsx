import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, SortDescriptor, Image, addToast, } from "@heroui/react";
import React, { createRef, Key, RefObject, useCallback, useMemo, useState } from "react";
import { EllipsisVertical, Pen, Trash } from "lucide-react";
import { Evoucher } from "@/types/evoucher";
import { Sponsors } from "@/types/sponsors";
import TableContent from "./TableContent";
import AddModal from "./AddEvoucherModal";
import { ConfirmationModal } from "@/components/modal/ConfirmationModal";
import { EvoucherType } from "@/types/evoucher-type";
import { useEvoucher } from "@/hooks/useEvoucher";
import type { Selection } from "@react-types/shared";

export const columns = [
    { name: "SPONSOR", uid: "sponsors", sortable: true },
    { name: "ACRONYM", uid: "acronym", sortable: true },
    { name: "DETAIL", uid: "detail", },
    { name: "DISCOUNT", uid: "discount", sortable: true },
    { name: "EXPIRATION", uid: "expiration", sortable: true },
    { name: "TYPE", uid: "type", sortable: true },
    { name: "COVER", uid: "cover", },
    { name: "BANNER", uid: "banner", },
    { name: "THUMPNAIL", uid: "thumpnail", },
    { name: "LOGO", uid: "logo", },
    { name: "ACTIONS", uid: "actions", },
];

export function capitalize(s: string) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

const INITIAL_VISIBLE_COLUMNS = [
    "sponsors",
    "acronym",
    "detail",
    "discount",
    "expiration",
    "type",
    "cover",
    "actions",
];

export default function EvoucherTable({
    sponsorName,
    evouchers,
    EvoucherType,
    sponsors,

}: {
    sponsorName: string,
    evouchers: Evoucher[];
    EvoucherType: EvoucherType[];
    sponsors: Sponsors[];
}) {
    const { fetchEvouchers, createEvoucher, updateEvoucher, deleteEvoucher } = useEvoucher();

    const [filterValue, setFilterValue] = useState("");
    const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set<string>());
    const [visibleColumns, setVisibleColumns] = useState(
        new Set(INITIAL_VISIBLE_COLUMNS),
    );
    const [typeFilter, setTypeFilter] = useState<Selection>("all");
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "acronym",
        direction: "ascending",
    });
    const [page, setPage] = useState(1);
    const [mode, setMode] = useState<"Add" | "Edit">("Add");
    const [modal, setModal] = useState({
        add: false,
        delete: false,
    });
    const hasSearchFilter = Boolean(filterValue);
    const [evoucherSelected, setEvoucherSelected] = useState<Evoucher>(evouchers[0]);

    const [field, setField] = useState({
        sponsor: "" as string,
        acronym: "" as string,
        detail: "" as string,
        discount: 0 as number,
        expiration: new Date() as Date,
        selectedType: new Set<string>() as Set<string>,
        cover: null as File | string | null,
    });
    const coverInputRef = createRef<HTMLInputElement | null>();

    const headerColumns = useMemo(() => {
        return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
    }, [visibleColumns]);

    const filteredItems = useMemo(() => {
        let filteredEvoucher = [...evouchers];

        if (hasSearchFilter) {
            filteredEvoucher = filteredEvoucher.filter((evoucher) =>
                evoucher.sponsors.name.en.toLowerCase().includes(filterValue.toLowerCase()) ||
                evoucher.type.name.toLowerCase().includes(filterValue.toLowerCase()) ||
                evoucher.discount.toString().includes(filterValue.toLowerCase()) ||
                evoucher.acronym.toLowerCase().includes(filterValue.toLowerCase()) ||
                evoucher.detail.en.toLowerCase().includes(filterValue.toLowerCase()) ||
                evoucher.expiration.toString().includes(filterValue.toLowerCase())
            );
        }
        if (typeFilter !== "all" && Array.from(typeFilter).length !== EvoucherType.length) {
            filteredEvoucher = filteredEvoucher.filter((evoucher) =>
                Array.from(typeFilter).includes(evoucher.type.name),
            );
        }

        return filteredEvoucher;
    }, [evouchers, filterValue, typeFilter]);


    const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        return filteredItems.slice(start, end);
    }, [page, filteredItems, rowsPerPage]);

    const sortedItems = useMemo(() => {
        return [...items].sort((a: Evoucher, b: Evoucher) => {
            const first = a[sortDescriptor.column as keyof Evoucher] as number;
            const second = b[sortDescriptor.column as keyof Evoucher] as number;
            const cmp = first < second ? -1 : first > second ? 1 : 0;

            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [sortDescriptor, items]);


    const renderCell = useCallback((item: Evoucher, columnKey: Key) => {
        const cellValue = item[columnKey as keyof Evoucher];

        switch (columnKey) {
            case "sponsors":
                return (cellValue as Sponsors).name.en;
            case "discount":
                return cellValue
            case "acronym":
                return cellValue;
            case "detail":
                return (cellValue as { en: string }).en;
            case "type":
                return (cellValue as { name: string }).name
            case "expiration":
                if (typeof cellValue === "string" || cellValue instanceof Date) {
                    return new Date(cellValue).toLocaleString("en-US", {
                        dateStyle: 'long',
                        timeStyle: 'short',
                        timeZone: 'Asia/Bangkok'
                    });
                }
            case "cover":
                return (
                    <Image
                        src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${item.photo?.coverPhoto}`}
                        alt="Cover"
                        width={80}
                    />
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
                                    key="edit"
                                    startContent={<Pen size="16px" />}
                                    onPress={() => { setMode("Edit"); setModal(prev => ({ ...prev, add: true })); setEvoucherSelected(item); }}
                                >
                                    Edit
                                </DropdownItem>
                                <DropdownItem
                                    key="delete"
                                    className="text-danger"
                                    color="danger"
                                    startContent={<Trash size="16px" />}
                                    onPress={() => { setModal(prev => ({ ...prev, delete: true })); setEvoucherSelected(item); }}
                                >
                                    Delete
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                );
            default:
                return cellValue || "";
        }
    }, []);

    const handleAdd = async (evoucher: FormData) => {
        const response = mode === "Add"
            ? await createEvoucher(evoucher)
            : mode === "Edit"
                ? await updateEvoucher(evoucherSelected._id, evoucher)
                : null;

        setModal(prev => ({ ...prev, add: false }));

        if (response) {
            await fetchEvouchers();
            addToast({
                title: `${mode} Successfully`,
                description: `Data has been ${mode.toLowerCase()}ed successfully`,
                color: "success",
            });
        }
    };

    const handleDelete = async () => {
        const response = await deleteEvoucher(evoucherSelected._id)

        if (response) {
            await fetchEvouchers()
            setModal(prev => ({ ...prev, delete: false }));
            addToast({
                title: "Delete Successfully",
                description: "Data has been delteted successfully",
                color: "success",
            });
        }
    };

    return (
        <div>
            <TableContent
                setIsAddOpen={() => setModal(prev => ({ ...prev, add: true }))}
                setMode={setMode}
                sortDescriptor={sortDescriptor}
                setSortDescriptor={setSortDescriptor}
                headerColumns={headerColumns}
                sortedItems={sortedItems}
                renderCell={renderCell}
                filterValue={filterValue}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                EvoucherType={EvoucherType}
                capitalize={capitalize}
                visibleColumns={visibleColumns}
                setVisibleColumns={(columns: Set<string>) => setVisibleColumns(new Set(columns))}
                columns={columns}
                selectedKeys={selectedKeys}
                setSelectedKeys={setSelectedKeys}
                filteredItems={filteredItems}
                page={page}
                pages={pages}
                setPage={setPage}
                onPreviousPage={() => setPage((page) => Math.max(1, page - 1))}
                onNextPage={() => setPage((page) => page + 1)}
                onClear={() => {
                    setFilterValue("");
                    setPage(1);
                }}
                onSearchChange={(val) => {
                    setFilterValue(val);
                    setPage(1);
                }}
            />

            {/* Add evoucher modal */}
            <AddModal
                isOpen={modal.add}
                onClose={() => setModal(prev => ({ ...prev, add: false }))}
                onAdd={handleAdd}
                title={mode}
                type={EvoucherType}
                evoucherSelected={evoucherSelected}
                sponsorId={sponsors.find((s) => s.name.en === sponsorName)?._id as string}
                field={field}
                setField={setField}
                coverInputRef={coverInputRef as RefObject<HTMLInputElement>}
            />

            {/* Delete evoucher modal */}
            <ConfirmationModal
                isOpen={modal.delete}
                onClose={() => setModal(prev => ({ ...prev, delete: false }))}
                onConfirm={handleDelete}
                title={`Delete ${evoucherSelected ? evoucherSelected.acronym : ""}`}
                body={"Are you sure you want to delete this evoucher?"}
                confirmColor='danger'
            />
        </div>
    )
};
