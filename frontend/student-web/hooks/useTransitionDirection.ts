// hooks/useTransitionDirection.ts
import { useEffect, useRef, useState } from 'react';

import { pageOrder } from '@/config/site'; // Adjust the import path as needed

export function useTransitionDirection(pathname: string) {
  const prevPath = useRef(pathname);
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  useEffect(() => {
    const prevIndex = pageOrder.indexOf(prevPath.current);
    const currentIndex = pageOrder.indexOf(pathname);

    if (prevIndex !== -1 && currentIndex !== -1) {
      setDirection(currentIndex > prevIndex ? 'right' : 'left');
    }

    prevPath.current = pathname;
  }, [pathname]);

  return direction;
}
