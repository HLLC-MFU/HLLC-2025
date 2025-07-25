'use client'

import { Image } from '@heroui/react';
import GlassButton from "@/components/ui/glass-button";
import { LogOut, LucideArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import { useEffect } from 'react';

export default function SettingsPage() {
    const router = useRouter();
    const { language, changeLanguage } = useLanguage();
    const { t } = useTranslation();
    const toggleLanguage = () => {
        changeLanguage(language === 'en' ? 'th' : 'en');
    };

    return (
        <div className="flex flex-col items-center justify-center fixed inset-0 w-full h-full bg-black/20 text-white">
            <div
                className="absolute inset-0 flex gap-2 p-6 pt-28 text-2xl"
                onClick={() => router.replace('/profile')}
            >
                <LucideArrowLeft size={30} />
                <p className="font-medium">{t('settings.back')}</p>
            </div>
            <div className="flex flex-col items-center justify-center gap-6">
                <p className="text-[24px] font-semibold">{t('settings.title')}</p>
                <GlassButton onClick={toggleLanguage}>
                    <Image src={language === 'en' ? '/images/uk.png' : '/images/th.png'} width={24} />
                    <p>{language === 'en' ? 'English' : 'ไทย'}</p>
                </GlassButton>
                <GlassButton onClick={() => router.replace('/logout')}>
                    <LogOut />
                    <p>{t('settings.logout')}</p>
                </GlassButton>
            </div>
        </div>
    )
}