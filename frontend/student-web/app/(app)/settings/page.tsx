'use client'

import { Image } from '@heroui/react';

import GlassButton from "@/components/ui/glass-button";
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center fixed inset-0 w-full h-full gap-6 text-white bg-black/20">
            <p className="text-[24px] font-semibold">Settings</p>
            <GlassButton>
                <Image src={'/images/uk.png'} width={24} />
                <p>English</p>
            </GlassButton>
            <GlassButton onClick={() => router.replace('/logout')}>
                <LogOut />
                <p>Logout</p>
            </GlassButton>
            <GlassButton onClick={() => router.replace('/profile')}>
                Back
            </GlassButton>
        </div>
    )
}