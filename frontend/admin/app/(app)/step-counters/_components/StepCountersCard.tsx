'use client';
import { FC } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { GraduationCap, CalendarDays, User, Footprints } from 'lucide-react';

interface TopThreeUser {
  name: string;
  id: string;
  steps: number;
  school: string;
  major: string;
  rank: number;
}

interface TopBySchoolUser {
  name: string;
  id: string;
  steps: number;
  school: string;
  schoolFull: string;
  major: string;
}

interface FirstAchieverUser {
  name: string;
  id: string;
  major: string;
  rank: number;
  date: string;
}

type Props = {
  data: TopThreeUser[] | TopBySchoolUser[] | FirstAchieverUser[];
  variant: 'topThree' | 'topBySchool' | 'firstAchiever';
};

const cardColors = [
  'bg-gradient-to-r from-orange-400 to-orange-500',
  'bg-gradient-to-r from-green-400 to-cyan-400',
  'bg-black text-white',
];

const StepContersCardList: FC<Props> = ({ data, variant }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {data.map((user: any, idx) => {
        if (variant === 'topThree') {
          return (
            <div
              key={user.id + idx}
              className={`rounded-xl text-white px-6 py-4 shadow-md relative w-full h-[140px] ${cardColors[idx]}`}
            >
              <div className="text-xl font-bold tracking-wide">{user.name}</div>
              <div className="text-sm mb-2">{user.id}</div>
              <div className="text-lg font-semibold">
                {user.steps.toLocaleString()} Steps
              </div>
              <div className="text-sm">{user.school} | {user.major}</div>
              <div className="absolute top-3 right-4 text-3xl font-bold opacity-30">
                {user.rank}
              </div>
            </div>
          );
        }

        if (variant === 'topBySchool') {
          return (
            <Card key={user.id + idx} className="rounded-xl border shadow-sm hover:shadow-md transition-all">
              <CardHeader className="flex items-center gap-4 border-b pb-2">
                <div className="text-center font-bold text-lg">{user.school}</div>
                <div className="text-xs text-gray-500 ml-auto">{user.schoolFull}</div>
              </CardHeader>
              <CardBody className="space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <User size={16} /> <span>{user.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{user.id}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap size={16} /> <span>{user.major}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Footprints size={16} /> <span>{user.steps.toLocaleString()}</span>
                </div>
              </CardBody>
            </Card>
          );
        }

        if (variant === 'firstAchiever') {
          return (
            <div key={user.rank} className="relative border rounded-xl p-4 bg-white shadow-sm">
              <div className="absolute top-2 left-2 text-xl font-bold text-gray-300">
                {user.rank}
              </div>
              <div className="mt-2 font-semibold text-lg">{user.name}</div>
              <p className="text-sm text-gray-500">{user.id}</p>
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <GraduationCap size={16} /> {user.major}
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                <CalendarDays size={16} /> {user.date}
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

export default StepContersCardList;
