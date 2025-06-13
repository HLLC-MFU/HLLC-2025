import { Accordion, AccordionItem } from "@heroui/react";
import TableLamduanFlowers from "./TableLamduanFlowers";
import { Flower2, Settings } from "lucide-react";
import { useState } from "react";
import CardLamduanFlowers from "./CardLamduanFlowers";
import { LamduanFlowers } from "@/types/lamduan-flowers";

export default function AccordionLamduan() {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const defaultContent =
        "กำลังสร้างมองข้ามไปก่อน🤙";
    const handleSearchQueryChange = (value: string) => {
        setSearchQuery(value);
    };

    // const getFilteredSortedLamduanFlowers = (lamduanflowers: LamduanFlowers[] , type: string): LamduanFlowers[] => {
    //     let filtered = [...lamduanflowers];
    //     const search = searchQuery[type]?.toLowerCase() ?? "";

    //     if(search.trim() !== "") {
    //         filtered = filtered.filter(
    //             (s) =>
    //                 s._id.toLowerCase().includes(search)
    //         );
    //     }
    // }


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
                    <TableLamduanFlowers />
                    {/* <CardLamduanFlowers />
                    <CardLamduanFlowers />
                    <CardLamduanFlowers />
                    <CardLamduanFlowers />
                    <CardLamduanFlowers />
                    <CardLamduanFlowers />
                    <CardLamduanFlowers />
                    <CardLamduanFlowers /> */}
                </div>
            </AccordionItem>
        </Accordion>
    );
}
