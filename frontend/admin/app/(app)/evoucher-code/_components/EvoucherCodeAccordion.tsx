import { Accordion, AccordionItem } from "@heroui/react";
import EvoucherCodeTable from "./EvoucherCodeTable";
import { Sponsors } from "@/types/sponsors";
import { EvoucherCode } from "@/types/evoucher-code";
import { Evoucher } from "@/types/evoucher";

type EvoucherCodeAccordionProps = {
    sponsors: Sponsors[];
    evoucherCodes: EvoucherCode[];
    evouchers: Evoucher[];
};

export default function EvoucherCodeAccordion({
    sponsors,
    evoucherCodes,
    evouchers,
}: EvoucherCodeAccordionProps) {
    return (
        <Accordion variant="splitted">
            {sponsors.map((sponsor) => {

                return (
                    <AccordionItem
                        key={sponsor._id}
                        aria-label={sponsor.name.en}
                        title={sponsor.name.en}
                    >
                        <EvoucherCodeTable
                            evoucherCodes={evoucherCodes}
                            evouchers={evouchers}
                            sponsors={sponsors}
                            sponsorId={sponsor._id}
                        />
                    </AccordionItem>
                );
            })}
        </Accordion>
    );
}
