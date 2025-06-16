import { Accordion, AccordionItem } from "@heroui/react";
import { Flower2, Settings } from "lucide-react";
import CardLamduanFlowers from "./CardLamduanFlowers";
import { useLamduanFlowers } from "@/hooks/useLamduanFlowers";

export default function AccordionLamduan() {
    const { lamduanFlowers, deleteLamduanFlowers } = useLamduanFlowers();

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
                {"กำลังสร้างมองข้ามไปก่อน🤙"}
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
                    {lamduanFlowers.map((item) => (
                        <CardLamduanFlowers
                            key={item._id}
                            lamduanflowers={item}
                            onDelete={deleteLamduanFlowers}
                        />
                    ))}
                </div>
            </AccordionItem>
        </Accordion>
    );
}
