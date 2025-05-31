'use client';

import { Card, CardBody, CardHeader } from "@heroui/react";
import type { School } from "@/types/school";
import { useRouter } from "next/navigation";
import { Appearance } from "@/types/appearance";

interface AppearanceCardProps {
    appearance: Appearance;
}

export function AppearanceCard({ appearance }: AppearanceCardProps) {
    const router = useRouter();

    const handleClick = () => {
        if (appearance?._id) {
            router.push(`/schools/appearance/${appearance._id}`);
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
                    {appearance?.school.name?.en || appearance?.school?.name?.th || "Unnamed School"}
                </h3>
            </CardHeader>
            <CardBody>
                <p className="text-gray-600">
                    {appearance?.school?.acronym ? `Acronym: ${appearance?.school?.acronym}` : "No acronym"}
                </p>
                <p className="text-gray-500 text-sm mt-2">
                    Click to view appearance details
                </p>
            </CardBody>
        </Card>
    );
}
