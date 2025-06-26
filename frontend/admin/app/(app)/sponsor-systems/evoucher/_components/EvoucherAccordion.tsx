import { Accordion, AccordionItem } from "@heroui/react";
import { Evoucher, EvoucherType } from "@/types/evoucher";
import { Globe, User } from "lucide-react";
import EvoucherTable from "./EvoucherTable";

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
        <Accordion variant="splitted" className="px-0">
            <AccordionItem
                key="global"
                aria-label="Accordion Global"
                title="Global"
                startContent={<Globe />}
                subtitle={
                    <p className="flex">
                        Total global evouchers:{' '}
                        <span className="text-primary ml-1">{globalEvouchers.length}</span>
                    </p>
                }
            >
                <EvoucherTable
                    evouchers={globalEvouchers}
                    sponsorName="Global"
                    evoucherType={EvoucherType.GLOBAL}
                    onAdd={() => onAdd(EvoucherType.GLOBAL)}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </AccordionItem>

            <AccordionItem
                key="individual"
                aria-label="Accordion Individual"
                title="Individual"
                startContent={<User />}
                subtitle={
                    <p className="flex">
                        Total individual evouchers:{' '}
                        <span className="text-primary ml-1">{individualEvouchers.length}</span>
                    </p>
                }
            >
                <EvoucherTable
                    evouchers={individualEvouchers}
                    sponsorName="Individual"
                    evoucherType={EvoucherType.INDIVIDUAL}
                    onAdd={() => onAdd(EvoucherType.INDIVIDUAL)}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </AccordionItem>
        </Accordion>
    );
}
