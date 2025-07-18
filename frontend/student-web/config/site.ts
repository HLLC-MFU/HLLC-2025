import { QrCode, Book, Globe, Home, Ticket } from 'lucide-react';

import { NavSection } from '@/types/nav';

export const siteConfig: {
  name: string;
  description: string;
  navMenuItems: NavSection[];
} = {
  name: 'HLLC',
  description:
    `พร้อมมั้ย⁉️ เพราะโลกของ MFU Wonder Bloom จะมีแต่คำว่า "มหัศจรรย์ และ สนุกสนาน"
    เพราะที่นี่ คือที่ ที่น้องๆทุกคนจะได้ “ปล่อยของ” และ “ปล่อยใจ” ไปพร้อมกันใน 🌷🔥กิจกรรม How to live and learn on campus 2025 #HLLC2025 ที่กำลังจะพาเหล่า MFU freshers ไปรู้จักชีวิตมหาลัยแบบที่ทั้งสนุก ตื่นเต้น ตื่นตา ตื่นใจและเต็มไปด้วยเรื่องราวมหัศจรรย์ 🌟
    เตรียมตัวให้พร้อมสำหรับความสนุกแบบจัดเต็ม ทั้งกิจกรรม เพื่อนใหม่ และพี่ๆ สุดน่ารัก ที่รอพาน้องๆ ไปเปิดโลกแบบ MFU Wonder Bloom สุดๆ 💕`,
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
