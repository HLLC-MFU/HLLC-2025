import { Accordion, AccordionItem, Image } from '@heroui/react';
import EvoucherCodeTable from './EvoucherCodeTable';
import { EvoucherCode } from '@/types/evoucher-code';
import { Evoucher } from '@/types/evoucher';

type EvoucherCodeAccordionProps = {
  evouchers: Evoucher[];
  evoucherName: string;
  evoucherCodes: EvoucherCode[];
  setUsedModal: (value: boolean) => void;
};

export default function EvoucherCodeAccordion({
  evouchers,
  evoucherName,
  evoucherCodes,
  setUsedModal,
}: EvoucherCodeAccordionProps) {
  const evoucherPhoto = evouchers.find((evoucher) => evoucher.name.en === evoucherName)?.photo.home; 
  
  return (
    <Accordion className="m-0 p-0" variant="splitted">
      <AccordionItem
        key={evoucherName}
        aria-label={evoucherName}
        title={evoucherName}
        subtitle={
          <p className="flex">
            <span>Total evoucher codes :</span>
            <span className="text-primary ml-1">{evoucherCodes?.length}</span>
          </p>
        }
        startContent={
          <Image
            src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${evoucherPhoto}`}
            className="h-12 w-12 rounded-md"
          />
        }
      >
        <EvoucherCodeTable
          evoucherCodes={evoucherCodes}
          setUsedModal={setUsedModal}
        />
      </AccordionItem>
    </Accordion>
  );
}
