"use client";

import {
    Accordion,
    AccordionItem,
    getKeyValue,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Chip,
    Button,
    Tooltip,
    Card
} from "@heroui/react";

import { Schools } from "@/types/schools";
import { ChevronRightIcon, PlusCircleIcon, BuildingLibraryIcon } from "@heroicons/react/24/outline";
import { Majors } from "@/types/majors";

interface SchoolAccordionProps {
    school: Schools;
    onDetail: (schoolId: number) => void;
    onCreateMajor: (schoolId: number) => void;
    onShowMajorDetail: (major: Majors) => void;
}

const majorColumns = [
    { key: "name", label: "Name" },
    { key: "acronym", label: "Acronym" },
    { key: "details", label: "Details" },
];

export default function SchoolAccordion({ school, onDetail, onShowMajorDetail, onCreateMajor }: SchoolAccordionProps) {
    const hasMajors = school.majors && school.majors.length > 0;

    return (
        <Accordion
            className="w-full rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 dark:border-gray-700"
            variant="shadow"
            selectionMode="multiple"
        >
            <AccordionItem
                key={school.id}
                aria-label={`Accordion-${school.id}`}
                title={
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-primary-50 dark:bg-primary-900">
                                <BuildingLibraryIcon className="w-5 h-5 text-primary-500" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    {school.acronym && (
                                        <Chip size="sm" variant="flat" color="primary">
                                            {school.acronym}
                                        </Chip>
                                    )}
                                    <span className="font-medium text-gray-800 dark:text-gray-200">
                                        {school.name}
                                    </span>
                                </div>
                                {hasMajors && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        {school.majors.length} {school.majors.length === 1 ? 'major' : 'majors'}
                                    </p>
                                )}
                            </div>
                        </div>
                        <Button
                            size="sm"
                            onPress={() => onDetail(school.id)}
                            aria-label={`View details for ${school.name}`}
                            className="hidden sm:flex"
                            color="primary"
                            variant="light"
                        >
                            View Details
                        </Button>
                    </div>
                }
                classNames={{
                    title: "text-base py-3",
                    content: "px-4 py-4",
                }}
            >
                <div className="flex flex-col gap-4">
                    {/* Brief summary */}
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                        {school.details || "No description available."}
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                        <strong className="text-sm text-gray-800 dark:text-gray-200">Majors:</strong>
                        <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            startContent={<PlusCircleIcon className="w-4 h-4" />}
                            aria-label="Add major"
                            onPress={() => onCreateMajor(school.id)}
                        >
                            Add Major
                        </Button>
                    </div>

                    {/* Majors Table */}
                    {hasMajors ? (
                        <Table
                            aria-label={`Majors table for ${school.name}`}
                            removeWrapper
                            shadow="sm"
                            isStriped
                            color="primary"
                            selectionMode="single"
                            onRowAction={(key) => {
                                const major = school.majors.find(m => m.id === key);
                                if (major) onShowMajorDetail(major);
                            }}
                            classNames={{
                                base: "rounded-lg overflow-hidden",
                                th: "bg-gray-50 dark:bg-gray-900 text-xs font-medium",
                                td: "py-2"
                            }}
                        >
                            <TableHeader columns={majorColumns}>
                                {(column) => (
                                    <TableColumn key={column.key} className="uppercase">
                                        {column.label}
                                    </TableColumn>
                                )}
                            </TableHeader>
                            <TableBody items={school.majors}>
                                {(item: Majors) => (
                                    <TableRow
                                        key={item.id}
                                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        {(columnKey) => (
                                            <TableCell>
                                                {columnKey === "acronym" && item[columnKey] ? (
                                                    <Chip size="sm" variant="flat" color="secondary">
                                                        {getKeyValue(item, columnKey)}
                                                    </Chip>
                                                ) : columnKey === "details" ? (
                                                    <Tooltip content={getKeyValue(item, columnKey)} placement="left">
                                                        <span className="line-clamp-1">
                                                            {getKeyValue(item, columnKey) || "No details"}
                                                        </span>
                                                    </Tooltip>
                                                ) : (
                                                    getKeyValue(item, columnKey)
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    ) : (
                        <Card className="p-4 flex flex-col items-center justify-center text-center border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <p className="text-gray-500 mb-2">No majors assigned yet</p>
                            <Button 
                                size="sm"
                                color="primary" 
                                variant="flat"
                                startContent={<PlusCircleIcon className="w-4 h-4" />}
                                onPress={() => onCreateMajor(school.id)}
                            >
                                Add First Major
                            </Button>
                        </Card>
                    )}

                    {/* View Detail Button for mobile */}
                    <div className="flex justify-end sm:hidden mt-2">
                        <Button
                            size="sm"
                            onPress={() => onDetail(school.id)}
                            aria-label={`View details for ${school.name}`}
                            color="primary"
                            variant="solid"
                            endContent={<ChevronRightIcon className="w-4 h-4" />}
                        >
                            Details
                        </Button>
                    </div>
                </div>
            </AccordionItem>
        </Accordion>
    );
}
