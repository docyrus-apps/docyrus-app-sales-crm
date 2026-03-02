'use client';

import { CheckSquare } from 'lucide-react';

import { cn } from '@/lib/utils';

import { type DocyrusValueProps } from './types';

interface TodoItem {
  id?: string;
  title?: string;
  completed?: boolean;
}

function isTodoArray(val: unknown): val is Array<TodoItem> {
  return Array.isArray(val);
}

export function TodoValue({ value, className }: DocyrusValueProps) {
  if (value == null || (Array.isArray(value) && value.length === 0)) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (!isTodoArray(value)) {
    return (
      <span className={cn('truncate text-sm', className)}>{String(value)}</span>
    );
  }

  const total = value.length;
  const completed = value.filter(t => t.completed).length;

  return (
    <span className={cn('inline-flex items-center gap-1 text-sm', className)}>
      <CheckSquare className="size-3.5 shrink-0 text-muted-foreground" />
      <span>
        {completed}/{total} completed
      </span>
    </span>
  );
}