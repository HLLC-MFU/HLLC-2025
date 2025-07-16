'use client';

import type React from 'react';

import { Check, AlertCircle, ChevronRight } from 'lucide-react';
import { cn } from '@heroui/react';

interface StepperItemProps {
  index: number;
  label: string;
  active: boolean;
  completed?: boolean;
  error?: boolean;
  isLast?: boolean;
  disabled?: boolean;
  description?: string | React.ReactNode;
  children?: React.ReactNode;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onPress?: () => void;
}

type StepConfig = {
  circle: {
    from: string;
    to: string;
    border: string;
    shadow: string;
  };
  text: string;
  line: string;
  accent: string;
  contentBg: string;
  contentBorder: string;
  labelColor: string;
};

export default function StepperItem({
  index,
  label,
  active,
  completed = false,
  error = false,
  isLast = false,
  disabled = false,
  description,
  children,
  icon: IconComponent,
  onPress,
}: StepperItemProps) {
  /* ------------------------------------------------------------------ */
  const getStepConfig = (): StepConfig => {
    if (disabled) {
      return {
        circle: {
          from: 'from-slate-50',
          to: 'to-slate-100',
          border: 'border-slate-200',
          shadow: 'shadow-slate-950/5',
        },
        text: 'text-slate-400',
        line: 'bg-slate-200',
        accent: 'text-slate-500',
        contentBg: 'bg-slate-50',
        contentBorder: 'border-slate-200',
        labelColor: 'text-slate-400',
      };
    }
    if (error) {
      return {
        circle: {
          from: 'from-red-50',
          to: 'to-red-100',
          border: 'border-red-400',
          shadow: 'shadow-red-400/20',
        },
        text: 'text-red-600',
        line: 'bg-red-400',
        accent: 'text-red-500',
        contentBg: 'bg-red-50',
        contentBorder: 'border-red-300',
        labelColor: 'text-gray-900',
      };
    }
    if (completed) {
      return {
        circle: {
          from: 'from-emerald-500',
          to: 'to-emerald-700',
          border: 'border-emerald-500',
          shadow: 'shadow-emerald-500/30',
        },
        text: 'text-white',
        line: 'bg-emerald-500',
        accent: 'text-emerald-700',
        contentBg: 'bg-emerald-50',
        contentBorder: 'border-emerald-500',
        labelColor: 'text-gray-900',
      };
    }
    if (active) {
      return {
        circle: {
          from: 'from-blue-500',
          to: 'to-blue-700',
          border: 'border-blue-500',
          shadow: 'shadow-blue-500/30',
        },
        text: 'text-white',
        line: 'bg-blue-500',
        accent: 'text-blue-700',
        contentBg: 'bg-blue-50',
        contentBorder: 'border-blue-500',
        labelColor: 'text-gray-900',
      };
    }

    /* default (pending) */
    return {
      circle: {
        from: 'from-white',
        to: 'to-slate-50',
        border: 'border-gray-300',
        shadow: 'shadow-black/10',
      },
      text: 'text-gray-500',
      line: 'bg-gray-300',
      accent: 'text-gray-400',
      contentBg: 'bg-gray-50',
      contentBorder: 'border-gray-300',
      labelColor: 'text-gray-900',
    };
  };
  const config = getStepConfig();
  const isInteractive = Boolean(onPress && !disabled);

  /* ------------------------------------------------------------------ */
  const StepContent = () => (
    <div className="flex items-stretch">
      {/* Timeline column */}
      <div className="flex flex-col items-center mr-4 min-h-20">
        {/* Step circle */}
        <div
          className={cn(
            'relative w-14 h-14 rounded-full border-2 flex items-center justify-center overflow-hidden shadow-md',
            config.circle.border,
            config.circle.shadow,
          )}
        >
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-br',
              config.circle.from,
              config.circle.to,
            )}
          />
          {completed ? (
            <Check
              className={cn('relative z-10', config.text)}
              size={24}
              strokeWidth={3}
            />
          ) : error ? (
            <AlertCircle
              className={cn('relative z-10', config.text)}
              size={24}
              strokeWidth={2.5}
            />
          ) : IconComponent ? (
            <IconComponent
              className={cn('relative z-10', config.text)}
              height={24}
              strokeWidth={2}
              width={24}
            />
          ) : (
            <span
              className={cn(
                'relative z-10 text-lg font-bold text-center',
                config.text,
              )}
            >
              {index}
            </span>
          )}
        </div>

        {/* Connecting line */}
        {!isLast && (
          <div
            className={cn(
              'w-0.5 flex-1 min-h-2 mt-3 rounded-full',
              config.line,
              completed || active ? 'opacity-100' : 'opacity-40',
            )}
          />
        )}
      </div>

      {/* Content column */}
      <div className="flex-1 pt-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <p
              className={cn(
                'text-lg font-bold leading-6 mb-0.5',
                config.labelColor,
              )}
            >
              {label}
            </p>

            {/* Status badge */}
            {(active || completed || error) && (
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border',
                  config.contentBg,
                  config.contentBorder,
                  config.accent,
                )}
              >
                {completed
                  ? 'Completed'
                  : error
                    ? 'Action Required'
                    : active
                      ? 'In Progress'
                      : 'Pending'}
              </span>
            )}
          </div>

          {isInteractive && (
            <ChevronRight
              className={config.accent.replace('text-', '')}
              size={20}
            />
          )}
        </div>

        {/* Description */}
        {(active || completed || error) && description && (
          <div
            className={cn(
              'p-4 rounded-lg border-l-4 mt-2 shadow-sm',
              config.contentBg,
              config.contentBorder,
            )}
          >
            {typeof description === 'string' ? (
              <p className="text-gray-700 text-base leading-snug font-normal">
                {description}
              </p>
            ) : (
              description
            )}
          </div>
        )}

        {/* Interactive children */}
        {active && children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
  /* ------------------------------------------------------------------ */

  if (isInteractive) {
    return (
      <button
        className={cn(
          'block w-full text-left mb-6 rounded-2xl p-1 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          disabled && 'cursor-not-allowed opacity-60',
        )}
        disabled={disabled}
        onClick={onPress}
      >
        <StepContent />
      </button>
    );
  }

  return (
    <div className={cn(isLast ? '' : 'mb-6')}>
      <StepContent />
    </div>
  );
}
