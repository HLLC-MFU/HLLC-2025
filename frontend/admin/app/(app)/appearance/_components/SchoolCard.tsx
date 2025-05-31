'use client';

import { Card, CardBody, CardHeader } from "@heroui/react";
import type { School } from "@/types/school";
import { useRouter } from "next/navigation";

interface SchoolCardProps {
    school: School;
}

export function SchoolCard({ school }: SchoolCardProps) {
    const router = useRouter();

    const handleClick = () => {
        if (school?._id) {
            router.push(`/schools/${school._id}`);
        }
    };

    return (
        <Card
            isPressable
            isHoverable
            onPress={handleClick}
            className="cursor-pointer transition hover:shadow-lg"
        >
            <CardHeader>
                <h3 className="text-lg font-semibold">
                    {school?.name?.en || school?.name?.th || "Unnamed School"}
                </h3>
            </CardHeader>
            <CardBody>
                <p className="text-gray-600">
                    {school?.acronym ? `Acronym: ${school?.acronym}` : "No acronym"}
                </p>
                <p className="text-gray-500 text-sm mt-2">
                    Click to view appearance details
                </p>
            </CardBody>
        </Card>
    );
}
