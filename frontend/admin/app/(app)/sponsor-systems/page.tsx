'use client'

import { PageHeader } from '@/components/ui/page-header';
import { CircleDollarSign, BadgeDollarSign, Ticket, TicketCheck } from 'lucide-react';
import SystemsList from './_components/SystemsList';

export default function SponsorSystems() {

  const elements = [
    {
      title: 'Sponsor',
      description: 'Sponsor Management',
      icon: <BadgeDollarSign />,
      href: '/sponsor-systems/sponsor',
    },
    {
      title: 'Evoucher',
      description: 'Evoucher Management',
      icon: <Ticket />,
      href: '/sponsor-systems/evoucher',
    },
    {
      title: 'Evoucher Code',
      description: 'Evoucher Code Management',
      icon: <TicketCheck />,
      href: '/sponsor-systems/evoucher-code',
    },
  ];

  return (
    <>
      <PageHeader description="Manage sponsor, evoucher and relative data" icon={<CircleDollarSign />} />
      <div className="flex flex-col">
        <div className="grid grid-cols-1 gap-3">
          {elements.map((item, index) => (
            <SystemsList 
              key={index}
              item={item}
            />
          ))}
        </div>
      </div>
    </>
  );
}
