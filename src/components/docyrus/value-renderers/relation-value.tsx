'use client';

import { Link } from 'lucide-react';

import { cn } from '@/lib/utils';

import { type DocyrusValueProps } from './types';

interface ExpandedRelation {
  id: string;
  name?: string;
  title?: string;
  display_name?: string;
}

function isExpandedRelation(val: unknown): val is ExpandedRelation {
  return typeof val === 'object' && val !== null && 'id' in val;
}

export function RelationValue({ value, enumOptions, className }: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  if (isExpandedRelation(value)) {
    const display = value.name ?? value.title ?? value.display_name ?? value.id;

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-primary text-sm',
          className
        )}>
        <Link className="size-3.5 shrink-0" />
        <span className="truncate">{display}</span>
      </span>
    );
  }

  const enumMatch = typeof value === 'string' ? enumOptions?.find(o => o.id === value) : undefined;
  const display = enumMatch ? enumMatch.name : String(value).slice(0, 8);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sm',
        enumMatch ? 'text-primary' : 'text-muted-foreground',
        className
      )}>
      <Link className="size-3.5 shrink-0" />
      <span className="truncate">{display}</span>
    </span>
  );
}