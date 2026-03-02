'use client';

import { FolderIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

import { type DocyrusValueProps } from './types';

interface FolderData {
  id?: string;
  name?: string;
  title?: string;
}

function isFolderData(val: unknown): val is FolderData {
  return typeof val === 'object' && val !== null;
}

export function FileStorageFolderValue({
  value,
  className
}: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  let display: string;

  if (typeof value === 'string') {
    display = value;
  } else if (isFolderData(value)) {
    display = value.name ?? value.title ?? value.id ?? 'Folder';
  } else {
    display = String(value);
  }

  return (
    <span className={cn('inline-flex items-center gap-1 text-sm', className)}>
      <FolderIcon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">{display}</span>
    </span>
  );
}