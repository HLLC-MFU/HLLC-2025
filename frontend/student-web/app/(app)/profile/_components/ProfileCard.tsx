'use client';
import { Card, CardBody } from '@heroui/react';
import {
  GraduationCap,
  School,
} from 'lucide-react';

import { ProfileSkeleton } from './ProfileSkeleton';

import { useProfile } from '@/hooks/useProfile';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';

export default function ProfileCard() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const user = useProfile(state => state.user);
  const majorName = useProfile(state => state.majorName);
  const schoolName = useProfile(state => state.schoolName);

  if (!user) return <ProfileSkeleton />;

  const fullName = [user.name?.first, user.name?.middle, user.name?.last]
    .filter(Boolean)
    .join(' ');

  return (
    <Card className="py-4 bg-black/40 backdrop-blur-3xl border border-white/40 rounded-2xl shadow-lg z-10">
      <CardBody className="flex flex-col items-center space-y-4 pt-2 px-4">
        <div className="flex flex-col items-center tracking-wide">
          <p className="text-xl font-semibold text-white">{fullName}</p>
          <p className="text-[#eeeeeeee] text-lg">{user.username}</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-[#1E90FF]">
            <School/>
            <p className='text-xl font-semibold'>SCHOOL</p>
          </div>
          <p className="text-[#eeeeeeee] text-lg">{schoolName?.[language]}</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-[#1E90FF]">
            <GraduationCap/>
            <p className='text-xl font-semibold'>MAJOR</p>
          </div>
          <p className="text-[#eeeeeeee] text-lg">{majorName?.[language]}</p>
        </div>
        {/* <div key={index} className="flex items-center space-x-4 min-h-[60px]">
          {Icon && <Icon className="w-10 h-10 rounded-full shrink-0 text-white" />}
          <div className="flex flex-col justify-center">
            <h4 className="font-bold text-large uppercase leading-tight text-white">
              {label}
            </h4>
            <p className="uppercase leading-tight text-white/80">{value}</p>
          </div>
        </div> */}
      </CardBody>
    </Card>
  );
}
