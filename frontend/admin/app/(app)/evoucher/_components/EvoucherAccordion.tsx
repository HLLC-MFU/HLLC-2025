import { Accordion, AccordionItem } from "@heroui/react";
import { Evoucher, EvoucherType } from "@/types/evoucher";
import { Globe, User } from "lucide-react";
import EvoucherTable from "./EvoucherTable";

export default function EvoucherAccordion({
    evouchers,
}: {
    evouchers: Evoucher[];
}) {
    const globalEvouchers = evouchers.filter(e => e.type === EvoucherType.GLOBAL);
    const individualEvouchers = evouchers.filter(e => e.type === EvoucherType.INDIVIDUAL);

    return (
        <Accordion variant="splitted" className="px-0">
            <AccordionItem
                key="global"
                aria-label="Accordion Global"
                title="Global"
                startContent={<Globe />}
            >
                <EvoucherTable
                    evouchers={globalEvouchers}
                    sponsorName="Global"
                    evoucherType={EvoucherType.GLOBAL}
                />
            </AccordionItem>

            <AccordionItem
                key="individual"
                aria-label="Accordion Individual"
                title="Individual"
                startContent={<User />}
            >
                <EvoucherTable
                    evouchers={individualEvouchers}
                    sponsorName="Individual"
                    evoucherType={EvoucherType.INDIVIDUAL}
                />
            </AccordionItem>
        </Accordion>
    );
}
