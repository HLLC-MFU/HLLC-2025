import { QrCode, Book, Globe, Home, Ticket } from 'lucide-react';

import { NavSection } from '@/types/nav';

export const siteConfig: {
  name: string;
  description: string;
  navMenuItems: NavSection[];
  links: Record<string, string>;
} = {
  name: 'HLLC Admin',
  description: '',
  navMenuItems: [
    {
      items: [
        { label: 'Home', href: '/', icon: Home },
        { label: 'Activity', href: '/activities', icon: Book },
        { label: 'QRCode', href: '/qrcode', icon: QrCode },
        { label: 'Evoucher', href: '/evoucher', icon: Ticket },
        { label: 'Community', href: '/community', icon: Globe },
      ],
    },
  ],
  links: {
    github: 'https://github.com/heroui-inc/heroui',
    twitter: 'https://twitter.com/hero_ui',
    docs: 'https://heroui.com',
    discord: 'https://discord.gg/9b6yyZKmH4',
    sponsor: 'https://patreon.com/jrgarciadev',
  },
};

export const pageOrder = siteConfig.navMenuItems.flatMap(group =>
  group.items.map(item => item.href),
);
