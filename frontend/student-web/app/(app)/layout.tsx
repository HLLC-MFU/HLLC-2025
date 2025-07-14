'use client';
import type React from 'react'; // Import React for React.ReactNode type

import BottomNav from '@/components/bottom-nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col text-foreground">
      {/* Optional: top nav */}
      {/* <Navbar /> */}
      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 pb-28">
        {children}
      </main>
      {/* Fixed bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 mx-4 pb-4">
        <BottomNav />
      </div>
    </div>
  );
}
