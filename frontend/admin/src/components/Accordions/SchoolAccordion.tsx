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
    Button
} from "@heroui/react";

import { Schools } from "@/types/schools";
import { ChevronRightIcon } from "@heroicons/react/16/solid";

interface SchoolAccordionProps {
    school: Schools;
    onDetail: (schoolId: number) => void;
}

const majorColumns = [
    { key: "name", label: "Name" },
    { key: "acronym", label: "Acronym" },
    { key: "details", label: "Details" },
];

export default function SchoolAccordion({ school, onDetail }: SchoolAccordionProps) {
    return (
        <Accordion
            className="w-full rounded-lg shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700"
            variant="splitted"
        >
            <AccordionItem
                key={school.id}
                aria-label={`Accordion-${school.id}`}
                title={
                    <span className="flex items-center gap-2">
                        {school.acronym && (
                            <Chip size="sm" variant="flat" color="primary">
                                {school.acronym}
                            </Chip>
                        )}
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                            {school.name}
                        </span>
                    </span>
                }

                className="px-2 py-2"
            >
                <div className="flex flex-col gap-4">
                    {/* Main content: Info on the left, majors on the right */}
                    <div className="flex flex-col md:flex-row gap-6 border-t border-gray-200 pb-4 py-4">
                        {/* Left: School Info */}
                        <div className="w-full md:w-1/2 flex flex-col gap-3 text-sm text-gray-800 dark:text-gray-200 border-r border-gray-200 pr-4">
                            <div className="flex items-start gap-2">
                                <strong>Details:</strong>
                                <span>{school.details || "No details available"}</span>
                            </div>
                        </div>

                        {/* Right: Majors Table */}
                        <div className="w-full md:w-1/2">
                            <strong className="text-sm text-gray-800 dark:text-gray-200">Majors:</strong>
                            {school.majors && school.majors.length > 0 ? (
                                <Table
                                    aria-label={`Majors table for ${school.name}`}
                                    className="mt-2"
                                    removeWrapper
                                    shadow="sm"
                                    isStriped
                                    color="primary"
                                >
                                    <TableHeader columns={majorColumns}>
                                        {(column) => (
                                            <TableColumn key={column.key} className="bg-gray-50 dark:bg-gray-900 rounded-tl-lg rounded-tr-lg">
                                                {column.label}
                                            </TableColumn>
                                        )}
                                    </TableHeader>
                                    <TableBody items={school.majors}>
                                        {(item) => (
                                            <TableRow key={item.id}>
                                                {(columnKey) => (
                                                    <TableCell>
                                                        {columnKey === "acronym" && item[columnKey] ? (
                                                            <Chip size="sm" variant="flat">
                                                                {getKeyValue(item, columnKey)}
                                                            </Chip>
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
                                <p className="ml-2 text-gray-500 mt-1">No majors assigned</p>
                            )}
                        </div>
                    </div>

                    {/* View Detail Button */}
                    <div className="flex justify-end">
                        <Button
                            size="md"
                            onPress={() => onDetail(school.id)}
                            aria-label={`View details for ${school.name}`}
                            className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg"
                            radius="full"
                            variant="solid"
                        >
                            View Detail
                            <ChevronRightIcon className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </AccordionItem>
        </Accordion>
    );
}
