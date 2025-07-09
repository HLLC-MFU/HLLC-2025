import { Accordion, AccordionItem } from "@heroui/react";

import EvoucherCodeTable from "./EvoucherCodeTable";

import { Sponsors } from "@/types/sponsors";
import { EvoucherCode } from "@/types/evoucher-code";
import { Evoucher } from "@/types/evoucher";

type EvoucherCodeAccordionProps = {
    sponsors: Sponsors[];
    evouchers: Evoucher[];
    evoucherCodes: (sponsorId: string) => Promise<EvoucherCode[]>;
    onAdd: () => void;
    onEdit: (evoucherCode: EvoucherCode) => void;
    onDelete: (evoucherCode: EvoucherCode) => void;
};

export default function EvoucherCodeAccordion({
    sponsors,
    evoucherCodes,
    evouchers,
    onAdd,
    onEdit,
    onDelete,
}: EvoucherCodeAccordionProps) {
    return (
        <Accordion selectionMode="multiple" variant="splitted">
            {sponsors.map((sponsor) => (
                <AccordionItem
                    key={sponsor._id}
                    aria-label={sponsor.name.en}
                    title={sponsor.name.en}
                >
                    <EvoucherCodeTable
                        evoucherCodesFetcher={evoucherCodes}
                        evouchers={evouchers}
                        sponsorId={sponsor._id}
                        sponsors={sponsors}
                        onAdd={onAdd}
                        onDelete={onDelete}
                        onEdit={onEdit}
                    />
                </AccordionItem>
            ))}
        </Accordion>
    );
}
