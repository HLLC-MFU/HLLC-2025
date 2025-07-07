import type { School } from "@/types/school";

import { Card, CardBody, CardHeader, CardFooter, Button, Divider, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Building2, GraduationCap, EllipsisVertical, Eye, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface SchoolCardProps {
    school: School;
    onEdit: (school: School) => void;
    onDelete: (school: School) => void;
}

export function SchoolCard({ school, onEdit, onDelete }: SchoolCardProps) {
    const router = useRouter();

    const handleViewDetails = () => {
        router.push(`/schools/${school._id}`);
    };

    return (
        <div className="hover:cursor-pointer" onClick={handleViewDetails}>        
        <Card isHoverable  className="h-full">
            <CardHeader className="flex gap-3 p-4">
                <Card
                    className="w-12 h-12 text-large items-center justify-center flex-shrink-0"
                    radius="md"
                >
                    {school.acronym}
                </Card>
                <div className="flex flex-col items-start min-w-0 text-start">
                    <p className="text-lg font-semibold truncate w-full">{school.name.en}</p>
                    <p className="text-small text-default-500 truncate w-full">{school.name.th}</p>
                </div>
            </CardHeader>
            <Divider />
            <CardBody className="gap-4 p-4">
                <div className="flex items-center gap-2">
                    <Building2 className="text-default-500 flex-shrink-0" size={16} />
                    <span className="text-sm text-default-500 truncate">{school.acronym}</span>
                </div>
                <div className="flex items-center gap-2">
                    <GraduationCap className="text-default-500 flex-shrink-0" size={16} />
                    <span className="text-sm text-default-500">{school.majors?.length ?? 0} Programs</span>
                </div>
                <p className="text-sm text-default-500 line-clamp-2">
                    {school.detail.en}
                </p>
            </CardBody>
            <Divider />
            <CardFooter className="flex justify-between p-4">
                <Button
                    className="flex-1 sm:flex-none"
                    color="primary"
                    size="sm"
                    startContent={<Eye size={16} />}
                    variant="light"
                    onPress={handleViewDetails}
                >
                    View Details
                </Button>
                <Dropdown>
                    <DropdownTrigger>
                        <Button
                            isIconOnly
                            className="flex-shrink-0"
                            color="primary"
                            size="sm"
                            variant="light"
                        >
                            <EllipsisVertical size={16} />
                        </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="School Actions">
                        <DropdownItem
                            key="edit"
                            startContent={<Pencil size={16} />}
                            onPress={() => onEdit(school)}
                        >
                            Edit School
                        </DropdownItem>
                        <DropdownItem
                            key="delete"
                            className="text-danger"
                            color="danger"
                            startContent={<Trash2 size={16} />}
                            onPress={() => onDelete(school)}
                        >
                            Delete School
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            </CardFooter>
        </Card>
        </div>
    );
} 