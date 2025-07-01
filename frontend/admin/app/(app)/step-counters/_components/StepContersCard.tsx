'use client';
import { FC } from 'react';

interface TopUser {
  name: string;
  id: string;
  steps: number;
  school: string;
  major: string;
  rank: number;
}

interface Props {
  topThree: TopUser[];
}

const cardColors = [
  'bg-gradient-to-r from-orange-400 to-orange-500',
  'bg-gradient-to-r from-green-400 to-cyan-400',
  'bg-black text-white',
];

const TopThreeCards: FC<Props> = ({ topThree }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
      {topThree.map((user, idx) => (
        <div
          key={user.id + idx}
          className={`rounded-xl text-white px-6 py-4 shadow-md relative w-full h-[140px] ${
            cardColors[idx]
          }`}
        >
          <div className="text-xl font-bold tracking-wide">{user.name}</div>
          <div className="text-sm mb-2">{user.id}</div>
          <div className="text-lg font-semibold">
            {user.steps.toLocaleString()} Steps
          </div>
          <div className="text-sm">
            {user.school} | {user.major}
          </div>
          <div className="absolute top-3 right-4 text-3xl font-bold opacity-30">
            {user.rank}
          </div>
        </div>
      ))}
    </div>
  );
};


export default TopThreeCards;
