"use client";

import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh max-h-dvh w-full min-w-dvw overflow-hidden">
      {/* Sidebar should be on the left and sticky */}
      <Sidebar />

      {/* Content area */}
      <div className="flex flex-col flex-1 overflow-hidden grow">
        {/* Sticky top navbar */}
        <Navbar />

        {/* Scrollable main content */}
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
