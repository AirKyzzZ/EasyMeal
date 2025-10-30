import React from 'react';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps): React.JSX.Element {
  return (
    <div className={cn('animate-pulse rounded-md bg-secondary', className)} />
  );
}

export function MealCardSkeleton(): React.JSX.Element {
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      {/* Image skeleton */}
      <div className="aspect-[4/3] rounded-t-lg">
        <Skeleton className="h-full w-full" />
      </div>

      <div className="p-4">
        {/* Title skeleton */}
        <Skeleton className="mb-2 h-6 w-3/4" />

        {/* Tags skeleton */}
        <div className="mb-3 flex gap-1">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        {/* Ingredients skeleton */}
        <div className="mb-3">
          <Skeleton className="mb-2 h-4 w-24" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        {/* Description skeleton */}
        <div className="space-y-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Action button skeleton */}
        <div className="mt-4 flex justify-between">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function MealGridSkeleton({
  count,
}: {
  count?: number;
}): React.JSX.Element {
  const [cols, setCols] = React.useState<number>(1);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = (): void => {
      const isLg = window.matchMedia('(min-width: 1024px)').matches;
      const isSm = window.matchMedia('(min-width: 640px)').matches;
      setCols(isLg ? 3 : isSm ? 2 : 1);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const effectiveCount = typeof count === 'number' ? count : cols;

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: effectiveCount }).map((_, index) => (
        <MealCardSkeleton key={index} />
      ))}
    </div>
  );
}
