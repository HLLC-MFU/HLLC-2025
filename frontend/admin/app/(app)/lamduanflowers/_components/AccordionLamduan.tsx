import { Accordion, AccordionItem } from "@heroui/react";
import TableCardLamduanFlowers from "./TableCardLamduanFlowers";
import { Car, Flower2, Settings } from "lucide-react";
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {/* <TableCardLamduanFlowers /> */}
                    <CardLamduanFlowers/>
                    <CardLamduanFlowers/>
                    <CardLamduanFlowers/>
                    <CardLamduanFlowers/>
                    <CardLamduanFlowers/>
                    <CardLamduanFlowers/>
                    <CardLamduanFlowers/>
                    <CardLamduanFlowers/>
                    <CardLamduanFlowers/>
                </div>
            </AccordionItem>
        </Accordion>
    );
}
