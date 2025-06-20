'use client';

import { Button, Card, CardFooter, CardHeader, Divider, } from "@heroui/react";
import type { School } from "@/types/school";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";

interface SchoolCardProps {
    school: School;
}

export function SchoolCard({ school }: SchoolCardProps) {
    const router = useRouter();

    const handleClick = () => {
        if (school?._id) {
            router.push(`/interfaces/${school._id}`);
        }
    };

    return (
        <div onClick={handleClick} className="hover:cursor-pointer">
            <Card isHoverable className="h-full">
                <CardHeader className="flex gap-3 p-4">
                    <Card
                        radius="md"
                        className="w-12 h-12 text-large items-center justify-center flex-shrink-0"
                    >
                        {school.acronym}
                    </Card>
                    <div className="flex flex-col items-start min-w-0 text-start">
                        <p className="text-lg font-semibold truncate w-full">{school.name.en}</p>
                        <p className="text-small text-default-500 truncate w-full">{school.name.th}</p>
                    </div>
                </CardHeader>
                <Divider />
                <CardFooter className="flex justify-between p-4">
                    <Button
                        variant="light"
                        color="primary"
                        size="sm"
                        startContent={<Eye size={16} />}
                        onPress={handleClick}
                        className="flex-1 sm:flex-none"
                    >
                        View Details
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
