'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCheck,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  XCircle,
} from 'lucide-react';

type CheckinStatusMeta = {
  label: string;
  message: string;
  color: string;
  backgroundColor: string;
  icon: React.ReactNode;
};

const getCheckinStatusMeta = (
  status: number,
  assessmentStatus: boolean,
): CheckinStatusMeta => {
  switch (status) {
    case 0:
      return {
        label: 'Not yet open',
        message: 'Not yet open for check-in',
        color: '#4b5563',
        backgroundColor: '#f3f4f6',
        icon: <Clock size={16} stroke="#4b5563" />,
      };
    case 1:
      return {
        label: 'Check-in Available',
        message: 'Check-in available now',
        color: '#854d0e',
        backgroundColor: '#fef9c3',
        icon: <AlertCircle size={16} stroke="#854d0e" />,
      };
    case 2:
      return {
        label: 'Checked in',
        message: 'You have already checked in',
        color: '#1d4ed8',
        backgroundColor: '#dbeafe',
        icon: <CheckCircle2 size={16} stroke="#1d4ed8" />,
      };
    case 3:
      return assessmentStatus
        ? {
            label: 'Success',
            message: 'You have successfully completed the activity',
            color: '#008000',
            backgroundColor: '#dcfce7',
            icon: <CheckCheck size={16} stroke="#008000" />,
          }
        : {
            label: 'Waiting for Assessment',
            message: 'Waiting for assessment to be completed',
            color: '#101010',
            backgroundColor: '#f59e0b',
            icon: <FileText size={16} stroke="#101010" />,
          };
    case -1:
      return {
        label: 'Missed',
        message: 'You missed the check-in time',
        color: '#b91c1c',
        backgroundColor: '#fee2e2',
        icon: <XCircle size={16} stroke="#b91c1c" />,
      };
    default:
      return {
        label: 'Unknown',
        message: 'Unknown status',
        color: '#6b7280',
        backgroundColor: '#f3f4f6',
        icon: <HelpCircle size={16} stroke="#6b7280" />,
      };
  }
};

type Props = {
  status: number;
  size?: 'sm' | 'md' | 'lg';
  withLabel?: boolean;
  withAnimation?: boolean;
  onClick?: () => void;
  assessmentStatus: boolean;
};

export default function CheckinStatusChip({
  status,
  assessmentStatus,
  size = 'md',
  withAnimation = true,
  onClick,
}: Props) {
  const { label, color, backgroundColor, icon } = getCheckinStatusMeta(
    status,
    assessmentStatus,
  );
  const sizeStyles = {
    sm: {
      paddingVertical: '4px',
      paddingHorizontal: '8px',
      fontSize: '10px',
      iconSize: 12,
    },
    md: {
      paddingVertical: '6px',
      paddingHorizontal: '12px',
      fontSize: '12px',
      iconSize: 16,
    },
    lg: {
      paddingVertical: '8px',
      paddingHorizontal: '16px',
      fontSize: '14px',
      iconSize: 18,
    },
  }[size];

  return (
    <AnimatePresence>
      <motion.div
        animate={{ scale: 1 }}
        aria-label={`Status: ${label}`}
        initial={withAnimation ? { scale: 0.95 } : undefined}
        role={onClick ? 'button' : 'text'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor,
          color,
          padding: `${sizeStyles.paddingVertical} ${sizeStyles.paddingHorizontal}`,
          borderRadius: 999,
          cursor: onClick ? 'pointer' : 'default',
          userSelect: 'none',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
          opacity: onClick ? 0.9 : 1,
          fontWeight: 600,
          fontSize: sizeStyles.fontSize,
        }}
        transition={{ type: 'spring', friction: 5, tension: 300 }}
        onClick={onClick}
      >
        <span style={{ marginRight: 4, display: 'flex', alignItems: 'center' }}>
          {React.isValidElement(icon)
            ? React.cloneElement(icon as React.ReactElement, {
                size: sizeStyles.iconSize,
              })
            : icon}
        </span>
        <span>{label}</span>
      </motion.div>
    </AnimatePresence>
  );
}
