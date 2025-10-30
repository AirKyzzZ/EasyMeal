import { useEffect, useState } from 'react';

/**
 * Hook to detect responsive grid columns based on screen size
 * Matches the grid layout: 1 column (mobile), 2 columns (sm: ≥640px), 3 columns (lg: ≥1024px)
 */
export function useResponsiveColumns(): number {
  const [cols, setCols] = useState<number>(1);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const update = (): void => {
      const isLg = window.matchMedia('(min-width: 1024px)').matches;
      const isSm = window.matchMedia('(min-width: 640px)').matches;
      setCols(isLg ? 3 : isSm ? 2 : 1);
    };

    update();
    window.addEventListener('resize', update);
    return (): void => window.removeEventListener('resize', update);
  }, []);

  return cols;
}
