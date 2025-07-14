'use client';

import {
  AlertCircle,
  CheckCircle2,
  CheckCheck,
  Clock,
  HelpCircle,
  XCircle,
} from 'lucide-react';

type CheckinStatusMeta = {
  label: string;
  message: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
};

function getCheckinStatusMeta(status: number): CheckinStatusMeta {
  switch (status) {
    case 0:
      return {
        label: 'Not yet open',
        message: 'Not yet open for check-in',
        color: 'text-gray-700',
        bg: 'bg-gray-100',
        icon: <Clock size={16} strokeWidth={2} />,
      };
    case 1:
      return {
        label: 'Check-in Available',
        message: 'Check-in available now',
        color: 'text-yellow-800',
        bg: 'bg-yellow-100',
        icon: <AlertCircle size={16} strokeWidth={2} />,
      };
    case 2:
      return {
        label: 'Checked in',
        message: 'You have already checked in',
        color: 'text-blue-800',
        bg: 'bg-blue-100',
        icon: <CheckCircle2 size={16} strokeWidth={2} />,
      };
    case 3:
      return {
        label: 'Success',
        message: 'Activity has ended',
        color: 'text-green-800',
        bg: 'bg-green-100',
        icon: <CheckCheck size={16} strokeWidth={2} />,
      };
    case -1:
      return {
        label: 'Missed',
        message: 'You missed the check-in time',
        color: 'text-red-800',
        bg: 'bg-red-100',
        icon: <XCircle size={16} strokeWidth={2} />,
      };
    default:
      return {
        label: 'Unknown',
        message: 'Unknown status',
        color: 'text-gray-600',
        bg: 'bg-gray-100',
        icon: <HelpCircle size={16} strokeWidth={2} />,
      };
  }
}

export default function CheckinStatusChip({
  status,
  withLabel = true,
  onClick,
}: {
  status: number;
  withLabel?: boolean;
  onClick?: () => void;
}) {
  const { label, icon, color, bg } = getCheckinStatusMeta(status);

  return (
    <button
      aria-label={withLabel ? label : 'Check-in status'}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${color} ${bg} shadow-sm transition hover:opacity-90 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${color.replace('text-', '')}`}
      type="button"
      onClick={onClick}
    >
      {icon}
      {withLabel && <span>{label}</span>}
    </button>
  );
}
