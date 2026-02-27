'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { type DocyrusValueProps } from './types';

export function ButtonValue({ field, className }: DocyrusValueProps) {
  return (
    <Button variant="outline" size="sm" className={cn(className)} disabled>
      {field.name}
    </Button>
  );
}