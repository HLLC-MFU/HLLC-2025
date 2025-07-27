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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  switch (status) {
    case 0:
      return {
        label: t('activity.timeline.notOpenYet'),
        message: t('activity.timeline.notOpenYetMessage'),
        color: 'white',
        backgroundColor: '#222831',
        icon: <Clock size={16} stroke="white" />,
      };
    case 1:
      return {
        label: t('activity.timeline.checkinAvailable'),
        message: t('activity.timeline.checkinAvailableMessage'),
        color: 'white',
        backgroundColor: '#3b82f6',
        icon: <AlertCircle size={16} stroke="white" />,
      };
    case 2:
      return {
        label: t('activity.timeline.checkedIn'),
        message: t('activity.timeline.checkedInMessage'),
        color: 'white',
        backgroundColor: '#10b981',
        icon: <CheckCircle2 size={16} stroke="white" />,
      };
    case 3:
      return assessmentStatus
        ? {
            label: t('activity.timeline.success'),
            message: t('activity.timeline.successMessage'),
            color: 'white',
            backgroundColor: '#22c55e',
            icon: <CheckCheck size={16} stroke="white" />,
          }
        : {
            label: t('activity.timeline.waitingForAssessment'),
            message: t('activity.timeline.waitingForAssessmenMessage'),
            color: 'white',
            backgroundColor: '#f59e0b',
            icon: <FileText size={16} stroke="white" />,
          };
    case -1:
      return {
        label: t('activity.timeline.missed'),
        message: t('activity.timeline.missedMessage'),
        color: 'white',
        backgroundColor: '#ef4444',
        icon: <XCircle size={16} stroke="white" />,
      };
    default:
      return {
        label: 'Unknown',
        message: 'Unknown status',
        color: 'white',
        backgroundColor: '#3b82f6',
        icon: <HelpCircle size={16} stroke="white" />,
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
