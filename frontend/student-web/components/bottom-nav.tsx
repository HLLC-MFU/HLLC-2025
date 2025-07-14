'use client';

import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@heroui/react';
import { Home, QrCode, Book, Ticket, Globe } from 'lucide-react'; // Importing Lucide React icons

// Mock siteConfig for demonstration purposes
// In a real application, this would come from your actual site configuration.
const siteConfig = {
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
};

export default function BottomNav() {
  const pathname = usePathname();
  const navItems = siteConfig.navMenuItems.flatMap(section => section.items);

  return (
    // This div centers the navigation bar horizontally
    <div className="relative flex justify-center w-full">
      <nav className="flex justify-around items-center py-3 px-2 w-full max-w-md rounded-full bg-black/30 backdrop-blur-xl border border-white/20 shadow-lg">
        {navItems.map(item => {
          const isActive = pathname === item.href;

          return (
            <motion.a
              key={item.href}
              className="relative flex flex-col items-center text-xs transition-all duration-300 z-10 flex-1 py-1"
              href={item.href}
              transition={{ duration: 0.3 }}
              initial={false} // Disable initial animation for Framer Motion
              // Animate text color based on active state
              animate={{ color: isActive ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.7)" }}
            >
              {isActive && (
                // This motion.span creates the "liquid" background pill for the active item
                <motion.span
                  className="absolute inset-0 rounded-full bg-white/20" // Background color for the active pill
                  layoutId="active-pill" // Unique ID for Framer Motion to animate its position
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }} // Spring animation for a fluid feel
                />
              )}
              <motion.div
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="flex flex-col items-center relative z-20 " // Ensure icon and label are above the pill
                // Scale the icon/label slightly when active for a subtle pop effect
                animate={{ scale: isActive ? 1.1 : 1 }}
              >
                <item.icon
                  className={cn(
                    'h-6 w-6 mb-1 transition-transform duration-300',
                    isActive && 'scale-110', // Keep existing scale for icon
                  )}
                />
                <p className="text-xs">{item.label}</p>
              </motion.div>
            </motion.a>
          );
        })}
      </nav>
    </div>
  );
}
