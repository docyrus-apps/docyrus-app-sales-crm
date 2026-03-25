'use client';

import { Skeleton } from '@/components/ui/skeleton';
import {
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem
} from '@/components/ui/timeline';

export function ActivitySkeleton() {
  return (
    <TimelineItem className="gap-2 pb-2 last:pb-0">
      <TimelineDot>
        <Skeleton className="size-3.5 rounded-full" />
      </TimelineDot>
      <TimelineConnector />
      <TimelineContent>
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="mt-2 h-3 w-32" />
          <div className="mt-3 flex items-center gap-2">
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </TimelineContent>
    </TimelineItem>
  );
}

export function ActivityLoadingSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="inline-block size-4 animate-spin rounded-full border-2 border-border border-t-foreground/70" />
        Loading activities\u2026
      </div>
      <div className="w-full space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={`skeleton-${i}`} className="flex gap-3">
            <Skeleton className="size-8 shrink-0 rounded-full bg-muted/70" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-14 rounded-full bg-muted/70" />
                <Skeleton className="h-3 w-32 bg-muted/70" />
              </div>
              <Skeleton className="h-3 w-24 bg-muted/70" />
              <Skeleton className="h-4 w-full bg-muted/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}