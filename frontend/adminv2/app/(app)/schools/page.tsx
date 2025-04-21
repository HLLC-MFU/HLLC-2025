"use client";

import { useEffect, useState } from "react";
import { Accordion, AccordionItem, Button, Card } from "@heroui/react";
import type { School } from "@/types/school";

// จำลอง import ไฟล์ JSON โดยตรง (เฉพาะตอน dev)
import mockSchools from "@/public/mock/schools.json"; // <-- ไฟล์อยู่ใน /src/mock/schools.json
import { Dot, Ellipsis, PlusIcon } from "lucide-react";

export default function SchoolsPage() {
    const [schools, setSchools] = useState<School[]>();

    useEffect(() => {
        const fetchSchools = async () => {
            // จำลองการโหลดข้อมูลแบบ async
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setSchools(mockSchools);
            console.log("Loaded mock data:", mockSchools);
        };
        fetchSchools();
    }, []);

    return (
        <div className="flex flex-col max-w-screen px-8 pb-8">
            <h1 className="text-2xl font-semibold mb-4">Schools</h1>
            <Card shadow="sm" className="p-4">
                <div className="flex py-4 gap-2">
                    <div className="grow" />
                    <Button variant="flat" color="primary" radius="full" size="md">
                        <PlusIcon />
                        School
                    </Button>
                    <Button variant="flat" color="primary" radius="full" size="md" isIconOnly>
                        <Ellipsis />
                    </Button>
                </div>
                {schools && (
                <Accordion variant="splitted" className="w-full">
                    {schools.map((school) => (
                        <AccordionItem
                            key={school.id}
                            aria-label={`Accordion-${school.id}`}
                            title={school.name.en}
                        >
                            <p className="text-sm text-gray-600">
                                {school.detail.en || "No description available"}
                            </p>
                        </AccordionItem>
                    ))}
                </Accordion>)}
            </Card>

        </div>
    );
}
