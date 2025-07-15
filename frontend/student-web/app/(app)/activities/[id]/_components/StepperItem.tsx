'use client';

import type { ReactNode } from 'react';

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
  description?: string | ReactNode;
  children?: ReactNode;
  icon?: any;
  onClick?: () => void;
}

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
  icon: Icon,
  onClick,
}: StepperItemProps) {
  const config = (() => {
    if (disabled)
      return {
        circle: 'bg-slate-100 border-slate-300 shadow-sm',
        text: 'text-slate-400',
        line: 'bg-slate-300',
        badge: 'bg-slate-100 border-slate-300 text-slate-500',
        descBox: 'bg-slate-50 border-l-slate-300 text-slate-600',
      };
    if (error)
      return {
        circle: 'bg-red-100 border-red-400 shadow-md',
        text: 'text-red-600',
        line: 'bg-red-400',
        badge: 'bg-red-50 border-red-400 text-red-600',
        descBox: 'bg-red-50 border-l-red-300 text-red-800',
      };
    if (completed)
      return {
        circle: 'bg-emerald-500 border-emerald-500 shadow-md',
        text: 'text-white',
        line: 'bg-emerald-500',
        badge: 'bg-emerald-50 border-emerald-500 text-emerald-700',
        descBox: 'bg-emerald-50 border-l-emerald-500 text-emerald-800',
      };
    if (active)
      return {
        circle: 'bg-blue-500 border-blue-500 shadow-md',
        text: 'text-white',
        line: 'bg-blue-500',
        badge: 'bg-blue-50 border-blue-500 text-blue-700',
        descBox: 'bg-blue-50 border-l-blue-500 text-blue-800',
      };

    return {
      circle: 'bg-white border-gray-300 shadow-sm',
      text: 'text-gray-500',
      line: 'bg-gray-300',
      badge: 'bg-gray-50 border-gray-300 text-gray-600',
      descBox: 'bg-gray-50 border-l-gray-300 text-gray-700',
    };
  })();

  const Wrapper = onClick && !disabled ? 'button' : 'div';

  return (
    <Wrapper
      className={cn('flex gap-4 mb-6', disabled && 'cursor-not-allowed')}
      onClick={onClick}
    >
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'w-14 h-14 rounded-full border-2 flex items-center justify-center relative',
            config.circle,
          )}
        >
          {completed ? (
            <Check className={config.text} size={22} strokeWidth={3} />
          ) : error ? (
            <AlertCircle className={config.text} size={22} strokeWidth={2.5} />
          ) : Icon ? (
            <Icon className={config.text} size={22} strokeWidth={2} />
          ) : (
            <span className={cn('font-bold text-base', config.text)}>
              {index}
            </span>
          )}
        </div>
        {!isLast && (
          <div className={cn('w-[3px] flex-1 mt-3 rounded-sm', config.line)} />
        )}
      </div>

      <div className="flex-1 pt-1">
        <div className="flex justify-between items-start mb-1">
          <div>
            <p
              className={cn(
                'text-lg font-bold leading-6',
                disabled ? config.text : 'text-gray-900',
              )}
            >
              {label}
            </p>
            {(active || completed || error) && (
              <div
                className={cn(
                  'inline-block mt-1 px-2 py-[2px] text-xs font-semibold uppercase border rounded-full',
                  config.badge,
                )}
              >
                {completed
                  ? 'Completed'
                  : error
                    ? 'Action Required'
                    : 'In Progress'}
              </div>
            )}
          </div>

          {onClick && !disabled && (
            <ChevronRight className={config.text} size={20} />
          )}
        </div>

        {(active || completed || error) && description && (
          <div
            className={cn(
              'mt-2 p-4 rounded-lg border-l-4 shadow-sm',
              config.descBox,
            )}
          >
            {typeof description === 'string' ? (
              <p className="text-sm leading-relaxed">{description}</p>
            ) : (
              description
            )}
          </div>
        )}

        {active && children && <div className="mt-4">{children}</div>}
      </div>
    </Wrapper>
  );
}
