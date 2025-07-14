'use client';

export default function DateBadge({ date }: { date: string }) {
  const d = new Date(date);
  const month = d.toLocaleString('en-US', { month: 'long' }).toUpperCase();
  const day = d.getDate();

  return (
    <div className="w-16 rounded-xl bg-gray-100 px-3 py-2 text-center">
      <div className="text-xs tracking-wide text-gray-600">{month}</div>
      <div className="text-2xl font-semibold text-gray-800">{day}</div>
    </div>
  );
}
