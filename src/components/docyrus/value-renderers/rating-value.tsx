'use client';

import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';

import { type DocyrusValueProps } from './types';

const MAX_STARS = 5;

export function RatingValue({ value, className }: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  const rating = Math.min(Math.max(Math.round(Number(value)), 0), MAX_STARS);

  if (Number.isNaN(rating)) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {Array.from({ length: MAX_STARS }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'size-4',
            i < rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-muted-foreground/30'
          )} />
      ))}
    </span>
  );
}