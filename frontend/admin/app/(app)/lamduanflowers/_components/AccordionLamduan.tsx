import { Accordion, AccordionItem } from "@heroui/react";
import TableLamduanFlowers from "./TableLamduanFlowers";
import { Flower2, Settings } from "lucide-react";
import { LamduanFilters } from "./LamduanFlowersFilters";
import { useState } from "react";

export default function AccordionLamduan() {
    const [searchQuery, setSearchQuery] = useState("");
    const defaultContent =
        "กำลังสร้างมองข้ามไปก่อน🤙";

    return (
        <Accordion variant="splitted">
            <AccordionItem
                key="1"
                aria-label="Accordion 1"
                title={
                    <div className="flex items-center gap-2">
                        <Settings />
                        <span>Lamduan Flower Setting</span>
                    </div>
                }
            >
                {defaultContent}
            </AccordionItem>

            <AccordionItem
                key="2"
                aria-label="Accordion 2"
                title={
                    <div className="flex items-center gap-2">
                        <Flower2 />
                        <span>Lamduan Flower Management</span>
                    </div>
                }
            >
                <div className="flex flex-col gap-6">
                <LamduanFilters
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                />
                <TableLamduanFlowers />
                </div>
            </AccordionItem>
        </Accordion>
    );
}
