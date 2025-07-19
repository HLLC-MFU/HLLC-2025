'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@heroui/react';
import { Home, QrCode, Book, Ticket, Globe } from 'lucide-react';
import { useAppearances } from '@/hooks/useAppearances';
import Image from 'next/image';

const siteConfig = {
  navMenuItems: [
    {
      items: [
        { label: 'Home', asset: 'home', href: '/', icon: Home },
        { label: 'Activity', asset: 'activities', href: '/activities', icon: Book },
        { label: 'QRCode', asset: 'qrcode', href: '/qrcode', icon: QrCode },
        { label: 'Evoucher', asset: 'evoucher', href: '/evouchers', icon: Ticket },
        { label: 'Community', asset: 'community', href: '/community', icon: Globe },
      ],
    },
  ],
};

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { assets } = useAppearances();
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
              className="relative flex flex-col items-center text-xs transition-all duration-300 z-10 flex-1 py-1"
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
              <motion.div
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="flex flex-col items-center relative z-20"
                animate={{ scale: isActive ? 1.1 : 1 }}
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
                <p className="text-xs">{item.label}</p>
              </motion.div>
            </motion.button>
          );
        })}
      </nav>
    </div>
  );
}
