"use client";

import { useEffect, useState, useMemo } from "react";
import {
    Accordion,
    AccordionItem,
    Button,
    Card,
    Image,
    Chip,
    Skeleton,
    Input,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    ButtonGroup,
    CardBody,
    CardHeader,
    CardFooter,
    Divider,
    Avatar
} from "@heroui/react";
import type { School } from "@/types/school";
import { Award, ChevronDownIcon, EllipsisVertical, PlusIcon, SearchIcon, AArrowUpIcon, AArrowDownIcon, Building2, GraduationCap, Users } from "lucide-react";
import mockSchools from "@/public/mock/schools.json";

const sortOptions = [
    { name: "name", label: "Name" },
    { name: "acronym", label: "Acronym" },
    { name: "majors", label: "Number of Majors" }
];

export default function SchoolsPage() {
    const [schools, setSchools] = useState<School[]>();
    const [sortBy, setSortBy] = useState<string>("name");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    useEffect(() => {
        const fetchSchools = async () => {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setSchools(mockSchools);
        };
        fetchSchools();
    }, []);

    const sortedSchools = useMemo(() => {
        if (!schools) return [];
        return [...schools].sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case "name":
                    comparison = a.name.en.localeCompare(b.name.en);
                    break;
                case "acronym":
                    comparison = a.acronym.localeCompare(b.acronym);
                    break;
                case "majors":
                    comparison = a.majors.length - b.majors.length;
                    break;
                default:
                    comparison = 0;
            }
            return sortDirection === "asc" ? comparison : -comparison;
        });
    }, [schools, sortBy, sortDirection]);

    const toggleSortDirection = () => {
        setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    };

    return (
        <div className="flex flex-col max-w-screen min-h-screen">
            <div className="container mx-auto space-y-6">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                        <div className="flex gap-3 w-full justify-between">
                            <Input
                                isClearable
                                className="w-full md:w-80"
                                placeholder="Search schools..."
                                startContent={<SearchIcon className="text-default-400" />}
                            />
                            <div className="flex gap-3">
                                <ButtonGroup>
                                    <Dropdown>
                                        <DropdownTrigger>
                                            <Button variant="flat">
                                                Sort by: {sortOptions.find(opt => opt.name === sortBy)?.label}
                                            </Button>
                                        </DropdownTrigger>
                                        <DropdownMenu
                                            aria-label="Sort Options"
                                            onAction={(key) => setSortBy(key as string)}
                                        >
                                            {sortOptions.map((option) => (
                                                <DropdownItem key={option.name} className="capitalize">
                                                    {option.label}
                                                </DropdownItem>
                                            ))}
                                        </DropdownMenu>
                                    </Dropdown>
                                    <Button
                                        variant="flat"
                                        isIconOnly
                                        onPress={toggleSortDirection}
                                    >
                                        {sortDirection === "asc" ? <AArrowUpIcon /> : <AArrowDownIcon />}
                                    </Button>
                                </ButtonGroup>
                                <Button color="primary" endContent={<PlusIcon />}>
                                    Add School
                                </Button>
                            </div>

                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-default-400 text-sm">Total {schools?.length} schools</span>
                    </div>
                </div>

                {!schools ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="p-4">
                                <div className="flex items-center space-x-4">
                                    <Skeleton className="w-12 h-12 rounded-lg" />
                                    <div className="flex-1">
                                        <Skeleton className="h-6 w-3/4 rounded-lg mb-2" />
                                        <Skeleton className="h-4 w-1/2 rounded-lg" />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedSchools.map((school) => (
                            <Card key={school.id} isHoverable>
                                <CardHeader className="flex gap-3">
                                    <Card
                                        radius="md"
                                        className="w-12 h-12 text-large items-center justify-center"
                                    >
                                        {school.acronym}
                                    </Card>
                                    <div className="flex flex-col items-start">
                                        <p className="text-lg font-semibold">{school.name.en}</p>
                                        <p className="text-small text-default-500">{school.name.th}</p>
                                    </div>
                                </CardHeader>
                                <Divider />
                                <CardBody className="gap-4">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="text-default-500" size={16} />
                                        <span className="text-sm text-default-500">{school.acronym}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className="text-default-500" size={16} />
                                        <span className="text-sm text-default-500">{school.majors.length} Programs</span>
                                    </div>
                                    <p className="text-sm text-default-500 line-clamp-2">
                                        {school.detail.en}
                                    </p>
                                </CardBody>
                                <Divider />
                                <CardFooter className="flex justify-between">
                                    <Button
                                        variant="light"
                                        color="primary"
                                        size="sm"
                                    >
                                        View Details
                                    </Button>
                                    <Button
                                        variant="light"
                                        color="primary"
                                        isIconOnly
                                        size="sm"
                                    >
                                        <EllipsisVertical size={16} />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}