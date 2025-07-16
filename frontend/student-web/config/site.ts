import { QrCode, Book, Globe, Home, Ticket } from 'lucide-react';

import { NavSection } from '@/types/nav';

export const siteConfig: {
  name: string;
  description: string;
  navMenuItems: NavSection[];
} = {
  name: 'HLLC Admin',
  description: '',
  navMenuItems: [
    {
      items: [
        { label: 'Home', href: '/', icon: Home },
        { label: 'Activity', href: '/activities', icon: Book },
        { label: 'QRCode', href: '/qrcode', icon: QrCode },
        { label: 'Evoucher', href: '/evouchers', icon: Ticket },
        { label: 'Community', href: '/community', icon: Globe },
      ],
    },
  ],
};

export const pageOrder = siteConfig.navMenuItems.flatMap(group =>
  group.items.map(item => item.href),
);
