"use client"
import { PageHeader } from "@/components/ui/page-header";
import { Accordion, AccordionItem } from "@heroui/react";
import { Flower } from "lucide-react";
import AccordionLamduan from "./_components/AccordionLamduan";

export default function LamduanflowersPage() {
    return(
        <>
            <PageHeader description='This is Lamduan lowers Page' icon={<Flower/>}/>
            <div className="flex flex-col min-h-screen">
                <div className="container mx-auto">
                    <div className="flex flex-col gap-6">
                        <AccordionLamduan/>
                    </div>
                </div>
            </div>
        </>
    )
}