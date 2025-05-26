"use client"
import { Accordion, AccordionItem } from "@heroui/react";
import { UserRound, UserRoundCog, UserRoundSearch } from "lucide-react";
import AdminPage from "./admin/page";
import StaffPage from "./staff/page";
import UserPage from "./user/page";

export const department = [
    {
        name: "Admin",
        table: <AdminPage />,
        icon: <UserRoundCog />,
    },
    {
        name: "Staff",
        table: <StaffPage />,
        icon: <UserRoundSearch />,
    },
    {
        name: "User",
        table: <UserPage />,
        icon: <UserRound />,
    },
];

export default function management() {

    return (
        <div className="flex flex-col min-h-screen">
            <div className="container mx-autopy-6">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">Users Management</h1>
                </div>
                <div className="flex flex-col items-start">
                    <Accordion variant="splitted">
                        {department.map((department, index) => (
                            <AccordionItem key={index} aria-label={department.name} startContent={department.icon} title={department.name} className="font-medium mb-2">
                                {department.table}
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </div>
    )
}