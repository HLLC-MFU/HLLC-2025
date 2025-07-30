'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@heroui/react';
import { Home, QrCode, Book, Ticket, Globe } from 'lucide-react';
import { useAppearances } from '@/hooks/useAppearances';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { assets } = useAppearances();
  const { t } = useTranslation();

  const siteConfig = {
    navMenuItems: [
      {
        items: [
          { label: t('nav.home'), asset: 'home', href: '/', icon: Home },
          { label: t('nav.activity'), asset: 'activities', href: '/activities', icon: Book },
          { label: t('nav.qrcode'), asset: 'qrcode', href: '/qrcode', icon: QrCode },
          { label: t('nav.evoucher'), asset: 'evoucher', href: '/evouchers', icon: Ticket },
          { label: t('nav.community'), asset: 'community', href: '/community/chat', icon: Globe },
        ],
      },
    ],
  };

  const navItems = siteConfig.navMenuItems.flatMap(section => section.items);

  return (
    <div className="relative flex justify-center w-full">
      <nav className="flex justify-around items-center py-3 px-2 w-full max-w-md rounded-full bg-black/30 backdrop-blur-xl border border-white/20 shadow-lg">
        {navItems.map(item => {
          const asset = assets && assets[item.asset];
          const isActive =
            item.href === '/'
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <motion.button
              key={item.href}
              type="button"
              onClick={() => router.push(item.href)}
              className="relative flex flex-col items-center text-[10px] transition-all duration-300 z-10 flex-1 py-1"
              transition={{ duration: 0.3 }}
              initial={false}
              animate={{
                color: isActive ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.7)",
              }}
            >
              {isActive && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-white/20"
                  layoutId="active-pill"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <div
                className="flex flex-col items-center relative z-20"
              >
                {asset ? (
                  <Image
                    alt={item.label}
                    src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${asset}`}
                    className="w-auto h-auto"
                    width={20}
                    height={20}
                  />
                ) : (
                  <item.icon
                    className={cn(
                      'h-6 w-6 mb-1 transition-transform duration-300',
                      isActive && 'scale-110'
                    )}
                  />
                )}
                <p className="text-[10px]">{item.label}</p>
              </div>
            </motion.button>
          );
        })}
      </nav>
    </div>
  );
}
