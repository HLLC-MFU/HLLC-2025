"use client";

import { Navbar } from "@/components/navbar";
import { MapProvider } from "@/providers/map-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-dvh max-h-dvh w-full min-w-dvw overflow-hidden">
            <div className="flex flex-col flex-1 overflow-hidden grow">
                <Navbar />
                <MapProvider>
                    <main className="flex-1 overflow-y-auto p-4 mx-4 md:mx-8">
                        {children}
                    </main>
                </MapProvider>
            </div>
        </div>
    );
}
