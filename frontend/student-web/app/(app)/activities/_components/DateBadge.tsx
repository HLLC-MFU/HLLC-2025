'use client';

export default function DateBadge({ date }: { date: string }) {
  const d = new Date(date);
  const month = d.toLocaleString('en-US', { month: 'long' }).toUpperCase();
  const day = d.getDate();

  return (
    <div className="rounded-xl py-1.5 px-3 flex flex-col items-center bg-gray-100 w-16">
      <span className="text-xs tracking-widest text-gray-500">{month}</span>
      <span className="text-2xl font-semibold text-gray-700">{day}</span>
    </div>
  );
}
