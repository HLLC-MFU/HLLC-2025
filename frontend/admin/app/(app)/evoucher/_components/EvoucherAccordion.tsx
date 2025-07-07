import { Accordion, AccordionItem } from "@heroui/react";
import { Globe, User } from "lucide-react";

import EvoucherTable from "./EvoucherTable";

import { Evoucher, EvoucherType } from "@/types/evoucher";

type EvoucherAccordionProps = {
    evouchers: Evoucher[];
    onAdd: (type: EvoucherType) => void;
    onEdit: (evoucher: Evoucher) => void;
    onDelete: (evoucher: Evoucher) => void;
};

export default function EvoucherAccordion({
    evouchers,
    onAdd,
    onEdit,
    onDelete,
}: EvoucherAccordionProps) {
    const globalEvouchers = evouchers.filter(e => e.type === EvoucherType.GLOBAL);
    const individualEvouchers = evouchers.filter(e => e.type === EvoucherType.INDIVIDUAL);

    return (
        <Accordion className="px-0" selectionMode="multiple" variant="splitted">
            <AccordionItem
                key="global"
                aria-label="Accordion Global"
                startContent={<Globe />}
                title="Global"
            >
                <EvoucherTable
                    evoucherType={EvoucherType.GLOBAL}
                    evouchers={globalEvouchers}
                    sponsorName="Global"
                    onAdd={() => onAdd(EvoucherType.GLOBAL)}
                    onDelete={onDelete}
                    onEdit={onEdit}
                />
            </AccordionItem>

            <AccordionItem
                key="individual"
                aria-label="Accordion Individual"
                startContent={<User />}
                title="Individual"
            >
                <EvoucherTable
                    evoucherType={EvoucherType.INDIVIDUAL}
                    evouchers={individualEvouchers}
                    sponsorName="Individual"
                    onAdd={() => onAdd(EvoucherType.INDIVIDUAL)}
                    onDelete={onDelete}
                    onEdit={onEdit}
                />
            </AccordionItem>
        </Accordion>
    );
}
