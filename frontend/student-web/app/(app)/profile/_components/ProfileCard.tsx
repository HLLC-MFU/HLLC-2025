'use client';
import { Card, CardBody } from '@heroui/react';
import {
  GraduationCap,
  IdCard,
  LucideIcon,
  School,
  UserCircle2,
} from 'lucide-react';

import { ProfileSkeleton } from './ProfileSkeleton';

import { useProfile } from '@/hooks/useProfile';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';

interface ProfileField {
  label: string;
  value: string;
  icon: LucideIcon;
}

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

  const profileItems: ProfileField[] = [
    { label: t('profile.name'), value: fullName, icon: UserCircle2 },
    { label: t('profile.studentid'), value: user.username, icon: IdCard },
    { label: t('profile.school'), value: schoolName?.[language] ?? '-', icon: School },
    { label: t('profile.major'), value: majorName?.[language] ?? '-', icon: GraduationCap },
  ];

  return (
    <Card className="py-4 bg-black/30 backdrop-blur-lg border border-white rounded-2xl shadow-lg z-10">
      <CardBody className="flex flex-col items-start space-y-4 pb-0 pt-2 px-4">
        {profileItems.map(({ label, value, icon: Icon }, index) => (
          <div key={index} className="flex items-center space-x-4 min-h-[60px]">
            <Icon className="w-10 h-10 rounded-full shrink-0 text-white" />
            <div className="flex flex-col justify-center">
              <h4 className="font-bold text-large uppercase leading-tight text-white">
                {label}
              </h4>
              <p className="uppercase leading-tight text-white/80">{value}</p>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
