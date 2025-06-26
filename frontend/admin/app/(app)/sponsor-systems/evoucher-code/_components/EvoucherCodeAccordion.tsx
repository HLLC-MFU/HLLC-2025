import { Accordion, AccordionItem } from '@heroui/react';
import EvoucherCodeTable from './EvoucherCodeTable';
import { Sponsors } from '@/types/sponsors';
import { EvoucherCode } from '@/types/evoucher-code';
import { useEffect, useState } from 'react';

type EvoucherCodeAccordionProps = {
  sponsors: Sponsors[];
  evoucherCodes: (sponsorId: string) => Promise<EvoucherCode[]>;
  onAdd: () => void;
  onEdit: (evoucherCode: EvoucherCode) => void;
  onDelete: (evoucherCode: EvoucherCode) => void;
};

export default function EvoucherCodeAccordion({
  sponsors,
  evoucherCodes,
  onAdd,
  onEdit,
  onDelete,
}: EvoucherCodeAccordionProps) {
  return (
    <Accordion className="p-0" variant="splitted">
      {sponsors.map((sponsor) => {
        const [evoucherCode, setEvoucherCode] = useState<EvoucherCode[] | null>(null);
        useEffect(() => {
                const fetchCodes = async () => {
                    try {
                        const result = await evoucherCodes(sponsor._id);
                        setEvoucherCode(result || []);
                    } catch (err) {
                        console.error("Failed to fetch evoucher codes", err);
                        setEvoucherCode([]);
                    }
                };
        
                fetchCodes();
            }, [sponsor._id]);
        

        return (
          <AccordionItem
            key={sponsor._id}
            aria-label={sponsor.name.en}
            title={sponsor.name.en}
            subtitle={
              <p className="flex">
                Total evoucher codes:{' '}
                <span className="text-primary ml-1">{evoucherCode?.length}</span>
              </p>
            }
          >
            <EvoucherCodeTable
              evoucherCode={evoucherCode}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
