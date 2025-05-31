"use client"

import React, { SVGProps } from "react";
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
    Pagination,
    Selection,
    ChipProps,
    SortDescriptor,
    Accordion,
    AccordionItem,
    Chip,
} from "@heroui/react";
import { ChevronDownIcon, EllipsisVertical, PlusIcon, SearchIcon, User } from "lucide-react";
import { mock } from "node:test";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
    size?: number;
};

export function capitalize(s: string) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

const mockupData = [
    {
        acronym: "ABC",
        sponsor: {
            name: "ABC Corporation"
        }
    },
    {
        acronym: "ABC",
        sponsor: {
            name: "ABC Corporation"
        }
    },
    {
        acronym: "ABC",
        sponsor: {
            name: "ABC Corporation"
        }
    },
    {
        acronym: "ABC",
        sponsor: {
            name: "ABC Corporation"
        }
    },
    {
        acronym: "ABC",
        sponsor: {
            name: "ABC Corporation"
        }
    },
    {
        acronym: "XYZ",
        sponsor: {
            name: "XYZ Enterprises"
        }
    },
    {
        acronym: "Springtime",
        sponsor: {
            name: "Springtime Co."
        }
    },
    {
        acronym: "ABC",
        sponsor: {
            name: "ABC Corporation"
        }
    },
    {
        acronym: "XYZ",
        sponsor: {
            name: "XYZ Enterprises"
        }
    },
    {
        acronym: "Springtime",
        sponsor: {
            name: "Springtime Co."
        }
    }
];


export const columns = [
    { name: "SPONSOR", uid: "sponsor" },
    { name: "ACRONYM", uid: "acronym", },
    { name: "DETAIL", uid: "detail", },
    { name: "DISCOUNT", uid: "discount", },
    { name: "EXPIRATION", uid: "expiration", },
    { name: "TYPE", uid: "type", },
    { name: "COVER", uid: "cover", },
    { name: "BANNER", uid: "banner", },
    { name: "THUMPNAIL", uid: "thumpnail", },
    { name: "LOGO", uid: "logo", },
    { name: "ACTIONS", uid: "actions", },
];

export const typeOptions = [
    { name: "Global", uid: "global" },
    { name: "Individual", uid: "individual" },
];

const typeColorMap: Record<string, ChipProps["color"]> = {
    global: "success",
    individual: "success",
};

// const INITIAL_VISIBLE_COLUMNS = ["sponsor", "acronym", "actions"];
const INITIAL_VISIBLE_COLUMNS = ["sponsor", "acronym", "detail", "discount", "expiration", "type", "cover", "actions"];

type Data = any[];

export default function EvoucherPage() {
    const [data, setData] = React.useState<any[]>([]);
    const [filterValue, setFilterValue] = React.useState("");
    const [selectedKeys, setSelectedKeys] = React.useState<Selection>(new Set([]));
    const [visibleColumns, setVisibleColumns] = React.useState<Selection>(
        new Set(INITIAL_VISIBLE_COLUMNS),
    );
    const [typeFilter, setTypeFilter] = React.useState<Selection>("all");
    // const [rowsPerPage, setRowsPerPage] = React.useState(5);
    const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
        column: "age",
        direction: "ascending",
    });
    const renderedSponsors = new Set();

    // const [page, setPage] = React.useState(1);

    const hasSearchFilter = Boolean(filterValue);

    const headerColumns = React.useMemo(() => {
        if (visibleColumns === "all") return columns;

        return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
    }, [visibleColumns]);

    const filteredItems = React.useMemo(() => {
        let filteredEvoucher = [...mockupData];

        if (hasSearchFilter) {
            filteredEvoucher = filteredEvoucher.filter((evoucher) =>
                evoucher.sponsor.name.toLowerCase().includes(filterValue.toLowerCase()),
            );
        }
        // if (typeFilter !== "all" && Array.from(typeFilter).length !== typeOptions.length) {
        //     filteredEvoucher = filteredEvoucher.filter((evoucher) =>
        //         Array.from(typeFilter).includes(evoucher.type),
        //     );
        // }

        return filteredEvoucher;
    }, [mockupData, filterValue, typeFilter]);

    // const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

    // const items = React.useMemo(() => {
    //     const start = (page - 1) * rowsPerPage;
    //     const end = start + rowsPerPage;

    //     return filteredItems.slice(start, end);
    // }, [page, filteredItems, rowsPerPage]);

    // const sortedItems = React.useMemo(() => {
    //     return [...items].sort((a: Data, b: Data) => {
    //         const first = a[sortDescriptor.column as keyof Data] as number;
    //         const second = b[sortDescriptor.column as keyof Data] as number;
    //         const cmp = first < second ? -1 : first > second ? 1 : 0;

    //         return sortDescriptor.direction === "descending" ? -cmp : cmp;
    //     });
    // }, [sortDescriptor, items]);

    const renderCell = React.useCallback((evoucher: Data, columnKey: React.Key) => {
        const cellValue = evoucher[columnKey as keyof Data];

        switch (columnKey) {
            case "sponsor":
                return cellValue.name;
            case "acronym":
                return cellValue;
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
                                <DropdownItem key="view">View</DropdownItem>
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

    // const onNextPage = React.useCallback(() => {
    //     if (page < pages) {
    //         setPage(page + 1);
    //     }
    // }, [page, pages]);

    // const onPreviousPage = React.useCallback(() => {
    //     if (page > 1) {
    //         setPage(page - 1);
    //     }
    // }, [page]);

    // const onRowsPerPageChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    //     setRowsPerPage(Number(e.target.value));
    //     setPage(1);
    // }, []);

    const onSearchChange = React.useCallback((value?: string) => {
        if (value) {
            setFilterValue(value);
            // setPage(1);
        } else {
            setFilterValue("");
        }
    }, []);

    const onClear = React.useCallback(() => {
        setFilterValue("");
        // setPage(1);
    }, []);

    const topContent = React.useMemo(() => {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex justify-between gap-3 items-end">
                    <Input
                        isClearable
                        className="w-full sm:max-w-[44%]"
                        placeholder="Search by name..."
                        startContent={<SearchIcon />}
                        value={filterValue}
                        onClear={() => onClear()}
                        onValueChange={onSearchChange}
                    />
                    <div className="flex gap-3">
                        <Dropdown>
                            <DropdownTrigger className="hidden sm:flex">
                                <Button endContent={<ChevronDownIcon className="text-small" />} variant="flat">
                                    type
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
                                    <DropdownItem key={type.uid} className="capitalize">
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
                            Add New
                        </Button>
                    </div>
                </div>
            </div>
        );
    }, [
        filterValue,
        typeFilter,
        visibleColumns,
        onSearchChange,
        // onRowsPerPageChange,
        data.length,
        hasSearchFilter,
    ]);

    // const bottomContent = React.useMemo(() => {
    //     return (
    //         <div className="py-2 px-2 flex justify-between items-center">
    //             <span className="w-[30%] text-small text-default-400">
    //                 {selectedKeys === "all"
    //                     ? "All items selected"
    //                     : `${selectedKeys.size} of ${filteredItems.length} selected`}
    //             </span>
    //             <Pagination
    //                 isCompact
    //                 showControls
    //                 showShadow
    //                 color="primary"
    //                 page={page}
    //                 total={pages}
    //                 onChange={setPage}
    //             />
    //             <div className="hidden sm:flex w-[30%] justify-end gap-2">
    //                 <Button isDisabled={pages === 1} size="sm" variant="flat" onPress={onPreviousPage}>
    //                     Previous
    //                 </Button>
    //                 <Button isDisabled={pages === 1} size="sm" variant="flat" onPress={onNextPage}>
    //                     Next
    //                 </Button>
    //             </div>
    //         </div>
    //     );
    // }, [selectedKeys, items.length, page, pages, hasSearchFilter]);

    return (
        <div className="flex flex-col min-h-screen">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">Evoucher Management</h1>
                </div>
            </div>

            <Table
                isHeaderSticky
                aria-label="Table header"
                bottomContentPlacement="outside"
                // classNames={{
                //     wrapper: "max-h-[382px]",
                // }}
                // selectedKeys={selectedKeys}
                // selectionMode="multiple"
                sortDescriptor={sortDescriptor}
                topContent={topContent}
                topContentPlacement="outside"
                onSelectionChange={setSelectedKeys}
                onSortChange={setSortDescriptor}
            >
                <TableHeader columns={headerColumns}>
                    {(column) => (
                        <TableColumn
                            key={column.uid}
                            align={column.uid === "actions" ? "center" : "start"}
                        // allowsSorting={column.sortable}
                        >
                            {column.name}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell colSpan={headerColumns.length} className="p-0">
                            <Accordion
                                selectionMode="multiple"
                                itemClasses={{
                                    trigger: "px-4 my-2 data-[hover=true]:bg-default-100 rounded-lg"
                                }}
                            >
                                {mockupData.map((evoucher) => {
                                    if (renderedSponsors.has(evoucher.sponsor.name)) {
                                        return null;
                                    }
                                    renderedSponsors.add(evoucher.sponsor.name);

                                    return (
                                        <AccordionItem
                                            key={evoucher.sponsor.name}
                                            aria-label={evoucher.sponsor.name}
                                            title={evoucher.sponsor.name}
                                        >
                                            <Table
                                                hideHeader
                                                removeWrapper
                                                aria-label="Table data"
                                            // bottomContent={bottomContent}
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
                                                <TableBody emptyContent={"No data found"} items={mockupData.filter((data) => data.sponsor.name === evoucher.sponsor.name)}>
                                                    {(item) => (
                                                        <TableRow key={item.sponsor.name}>
                                                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </AccordionItem>
                                    )
                                })};
                            </Accordion>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    )
}