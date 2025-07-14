'use client';

import React from 'react';
import { cn } from '@heroui/react'; // or your own utility

type GlassButtonProps = {
  children: React.ReactNode;
  className?: string;
  iconOnly?: boolean;
  onClick?: () => void;
};

export default function GlassButton({
  children,
  className,
  iconOnly = false,
  onClick,
}: GlassButtonProps) {
  return (
    <button
      className={cn(
        'backdrop-blur-md bg-white/10 border border-white/30 shadow-md transition-all',
        'hover:bg-white/20 active:scale-95',
        'rounded-full',
        iconOnly ? 'p-3 aspect-square' : 'py-2 px-4',
        className,
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-center gap-2">{children}</div>
    </button>
  );
}
