import { LogOutIcon, BookIcon, QrCode, CircleUserRound, ShieldAlert, BellRing, Ticket } from 'lucide-react';

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
      section: 'Activity',
      items: [
        { label: 'Activities', href: '/activities', icon: BookIcon },
        { label: 'CheckIn', href: '/checkin', icon: QrCode },
        { label: 'Notifications' , href: '/notifications' , icon: BellRing},
        { label: 'E-vouchers', href: '/evouchers', icon: Ticket },
      ],
    },
    {
      section: 'Account',
      items: [
        { label: 'Profile', href: '/profile', icon: CircleUserRound },
        { label: 'Report' , href: '/report' , icon: ShieldAlert},
        { label: 'Logout', href: '/logout', icon: LogOutIcon },
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
