"use client"

import React from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Input,
    Button,
    DropdownTrigger,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Selection,
    ChipProps,
    SortDescriptor,
    Accordion,
    AccordionItem,
    Chip,
} from "@heroui/react";
import { ChevronDownIcon, EllipsisVertical, PlusIcon, SearchIcon } from "lucide-react"

export function capitalize(s: string) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

const mockupData: Evoucher[] = [
    {
        discount: 10,
        acronym: "EVA1",
        type: { name: "Individual" },
        sponsor: {
            name: { en: "Sponsor A", th: "ผู้สนับสนุน A" },
        },
        detail: { en: "Discount on summer products", th: "ส่วนลดฤดูร้อน" },
        campaign: { name: "Campaign 1" },
        expiration: new Date("2025-12-31"),
    },
    {
        discount: 15,
        acronym: "EVA2",
        type: { name: "Global" },
        sponsor: {
            name: { en: "Sponsor A", th: "ผู้สนับสนุน A" },
        },
        detail: { en: "Special offer for new members", th: "ข้อเสนอพิเศษสำหรับสมาชิกใหม่" },
        campaign: { name: "Campaign 2" },
        expiration: new Date("2025-10-31"),
    },
    {
        discount: 20,
        acronym: "EVB1",
        type: { name: "Individual" },
        sponsor: {
            name: { en: "Sponsor B", th: "ผู้สนับสนุน B" },
        },
        detail: { en: "Back-to-school discount", th: "ส่วนลดกลับไปโรงเรียน" },
        campaign: { name: "Campaign 3" },
        expiration: new Date("2025-09-30"),
    },
    {
        discount: 25,
        acronym: "EVB2",
        type: { name: "Global" },
        sponsor: {
            name: { en: "Sponsor B", th: "ผู้สนับสนุน B" },
        },
        detail: { en: "Autumn special offer", th: "ข้อเสนอพิเศษฤดูใบไม้ร่วง" },
        campaign: { name: "Campaign 4" },
        expiration: new Date("2025-11-15"),
    },
    {
        discount: 30,
        acronym: "EVB3",
        type: { name: "Individual" },
        sponsor: {
            name: { en: "Sponsor B", th: "ผู้สนับสนุน B" },
        },
        detail: { en: "Winter wonderland", th: "มหัศจรรย์ฤดูหนาว" },
        campaign: { name: "Campaign 5" },
        expiration: new Date("2025-12-01"),
    },
];


import { Evoucher } from "@/types/evoucher";

export const columns = [
    { name: "SPONSOR", uid: "sponsor", sortable: true },
    { name: "ACRONYM", uid: "acronym", sortable: true },
    { name: "DETAIL", uid: "detail", sortable: true },
    { name: "DISCOUNT", uid: "discount", sortable: true },
    { name: "EXPIRATION", uid: "expiration", sortable: true },
    { name: "TYPE", uid: "type", sortable: true },
    { name: "COVER", uid: "cover", },
    { name: "BANNER", uid: "banner", },
    { name: "THUMPNAIL", uid: "thumpnail", },
    { name: "LOGO", uid: "logo", },
    { name: "ACTIONS", uid: "actions", },
];

export const typeOptions = [
    { name: "Global" },
    { name: "Individual" },
];

const typeColorMap: Record<string, ChipProps["color"]> = {
    Global: "success",
    Individual: "warning",
};

const INITIAL_VISIBLE_COLUMNS = ["sponsor", "acronym", "detail", "discount", "expiration", "type", "actions"];

export default function EvoucherPage() {
    const [evoucher, setEvoucher] = React.useState<Evoucher[]>([]);
    const [filterValue, setFilterValue] = React.useState("");
    const [selectedKeys, setSelectedKeys] = React.useState<Selection>(new Set([]));
    const [visibleColumns, setVisibleColumns] = React.useState<Selection>(
        new Set(INITIAL_VISIBLE_COLUMNS),
    );
    const [typeFilter, setTypeFilter] = React.useState<Selection>("all");
    const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
        column: "acronym",
        direction: "ascending",
    });
    const renderedSponsors = new Set();

    const hasSearchFilter = Boolean(filterValue);

    const headerColumns = React.useMemo(() => {
        if (visibleColumns === "all") return columns;

        return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
    }, [visibleColumns]);

    const filteredItems = React.useMemo(() => {
        let filteredEvoucher = [...mockupData];

        if (hasSearchFilter) {
            filteredEvoucher = filteredEvoucher.filter((evoucher) =>
                evoucher.sponsor.name.en.toLowerCase().includes(filterValue.toLowerCase()) ||
                evoucher.type.name.toLowerCase().includes(filterValue.toLowerCase()) ||
                evoucher.discount.toString().includes(filterValue.toLowerCase()) ||
                evoucher.acronym.toLowerCase().includes(filterValue.toLowerCase()) ||
                evoucher.detail.en.toLowerCase().includes(filterValue.toLowerCase()) ||
                evoucher.expiration.toString().includes(filterValue.toLowerCase())
            );
        }
        if (typeFilter !== "all" && Array.from(typeFilter).length !== typeOptions.length) {
            filteredEvoucher = filteredEvoucher.filter((evoucher) =>
                Array.from(typeFilter).includes(evoucher.type.name),
            );
        }

        return filteredEvoucher;
    }, [mockupData, filterValue, typeFilter]);

    const renderCell = React.useCallback((evoucher: Evoucher, columnKey: React.Key) => {
        const cellValue = evoucher[columnKey as keyof Evoucher];

        console.log(cellValue)

        switch (columnKey) {
            case "sponsor":
                return cellValue.name.en;
            case "detail":
                return cellValue.en;
            case "type":
                return cellValue.name;
            case "expiration":
                return cellValue.toLocaleString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "2-digit",
                });
            case "type":
                return (
                    <Chip color={typeColorMap[cellValue.name]} size="sm" variant="flat">
                        {cellValue.name}
                    </Chip>
                )
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
                                <DropdownItem key="edit">Edit</DropdownItem>
                                <DropdownItem key="delete">Delete</DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                );
            default:
                return cellValue;
        }
    }, []);

    const onSearchChange = React.useCallback((value?: string) => {
        if (value) {
            setFilterValue(value);
        } else {
            setFilterValue("");
        }
    }, []);

    const onClear = React.useCallback(() => {
        setFilterValue("");
    }, []);

    const topContent = React.useMemo(() => {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex justify-between gap-3 items-end">
                    <Input
                        isClearable
                        className="w-full sm:max-w-[44%]"
                        placeholder="Search evoucher"
                        startContent={<SearchIcon />}
                        value={filterValue}
                        onClear={() => onClear()}
                        onValueChange={onSearchChange}
                    />
                    <div className="flex gap-3">
                        <Dropdown>
                            <DropdownTrigger className="hidden sm:flex">
                                <Button endContent={<ChevronDownIcon className="text-small" />} variant="flat">
                                    Type
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                                disallowEmptySelection
                                aria-label="Table Columns"
                                closeOnSelect={false}
                                selectedKeys={typeFilter}
                                selectionMode="multiple"
                                onSelectionChange={setTypeFilter}
                            >
                                {typeOptions.map((type) => (
                                    <DropdownItem key={type.name} className="capitalize">
                                        {capitalize(type.name)}
                                    </DropdownItem>
                                ))}
                            </DropdownMenu>
                        </Dropdown>
                        <Dropdown>
                            <DropdownTrigger className="hidden sm:flex">
                                <Button endContent={<ChevronDownIcon className="text-small" />} variant="flat">
                                    Columns
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                                disallowEmptySelection
                                aria-label="Table Columns"
                                closeOnSelect={false}
                                selectedKeys={visibleColumns}
                                selectionMode="multiple"
                                onSelectionChange={setVisibleColumns}
                            >
                                {columns.map((column) => (
                                    <DropdownItem key={column.uid} className="capitalize">
                                        {capitalize(column.name)}
                                    </DropdownItem>
                                ))}
                            </DropdownMenu>
                        </Dropdown>
                        <Button color="primary" endContent={<PlusIcon />}>
                            Add Evoucher
                        </Button>
                    </div>
                </div>
            </div>
        );
    }, [
        filterValue,
        typeFilter,
        visibleColumns,
        typeOptions,
        onSearchChange,
        evoucher.length,
    ]);

    const bodyContent = React.useMemo(() => {
        return (
            <Accordion
                selectionMode="multiple"
                itemClasses={{
                    trigger: "px-4 mt-2 mb-1 data-[hover=true]:bg-default-100 rounded-lg"
                }}
            >
                {mockupData.map((evoucher) => {
                    if (renderedSponsors.has(evoucher.sponsor.name.en)) {
                        return null;
                    }
                    renderedSponsors.add(evoucher.sponsor.name.en);

                    return (
                        <AccordionItem
                            key={evoucher.sponsor.name.en}
                            aria-label={evoucher.sponsor.name.en}
                            title={evoucher.sponsor.name.en}
                        >
                            <Table
                                hideHeader
                                removeWrapper
                                aria-label="Table data"
                                // selectedKeys={selectedKeys}
                                // selectionMode="multiple"
                                // onSelectionChange={setSelectedKeys}
                            >
                                <TableHeader columns={headerColumns}>
                                    {(column) => (
                                        <TableColumn
                                            key={column.uid}
                                            align={column.uid === "actions" ? "center" : "start"}
                                        >
                                            {column.name}
                                        </TableColumn>
                                    )}
                                </TableHeader>
                                <TableBody emptyContent={"No data found"} items={filteredItems.filter((data) => data.sponsor.name.en === evoucher.sponsor.name.en)}>
                                    {(item) => (
                                        <TableRow key={item.acronym}>
                                            {(columnKey) => <TableCell className="w-48">{renderCell(item, columnKey)}</TableCell>}
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </AccordionItem>
                    )
                })};
            </Accordion>
        );
    }, [
        filteredItems,
        renderedSponsors,
        mockupData,
        visibleColumns,
        headerColumns,
        topContent,
    ]);

    return (
        <div className="flex flex-col min-h-screen">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">Evoucher Management</h1>
                </div>

                <Table
                    isHeaderSticky
                    aria-label="Table header"
                    bottomContentPlacement="outside"
                    topContent={topContent}
                    topContentPlacement="outside"
                    // selectedKeys={selectedKeys}
                    // selectionMode="multiple"
                    // onSelectionChange={setSelectedKeys}
                    sortDescriptor={sortDescriptor}
                    onSortChange={setSortDescriptor}
                >
                    <TableHeader columns={headerColumns}>
                        {(column) => (
                            <TableColumn
                                key={column.uid}
                                align={column.uid === "actions" ? "center" : "start"}
                                className="w-48"
                                allowsSorting={column.sortable}
                            >
                                {column.name}
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={headerColumns.length} className="p-0">
                                {bodyContent}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}