import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-secondary",
        className
      )}
    />
  );
}

export function MealCardSkeleton() {
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

export function MealGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <MealCardSkeleton key={index} />
      ))}
    </div>
  );
}
