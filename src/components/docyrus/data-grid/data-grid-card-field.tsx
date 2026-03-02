'use client';

import { type ReactNode } from 'react';

import { Check, Star, X } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

import { cn } from '@/lib/utils';

import {
  type CellOpts,
  type CellSelectOption,
  type CellUserOption,
  type FileCellData
} from './types';
import {
  formatDateForDisplay,
  getFileIcon,
  getUrlHref
} from './lib/data-grid';
import {
  formatDateRange,
  formatDuration,
  formatTime,
  parseDateRange
} from './lib/utils';

function getInitials(value: string, fallback?: string): string {
  const fallbackValue = fallback?.trim().toUpperCase();

  if (fallbackValue) return fallbackValue.slice(0, 2);

  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0]?.slice(0, 2).toUpperCase() ?? 'U';

  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';

  return `${first}${last}`.toUpperCase() || 'U';
}

function formatNumberDisplayValue(params: {
  value: string;
  variant: 'number' | 'currency' | 'percent';
  currency?: string;
}): string {
  const { value, variant, currency } = params;

  if (!value) return '';

  const parsedValue = Number(value);

  if (Number.isNaN(parsedValue)) return value;

  if (variant === 'currency') {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency ?? 'USD'
      }).format(parsedValue);
    } catch {
      return parsedValue.toFixed(2);
    }
  }

  if (variant === 'percent') return `${parsedValue}%`;

  return value;
}

function formatDateTimeForDisplay(value: string): string {
  if (!value) return '';

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString();
}

interface DataGridCardFieldProps {
  value: unknown;
  cellOpts: CellOpts | undefined;
}

export function DataGridCardField({ value, cellOpts }: DataGridCardFieldProps): ReactNode {
  if (value == null || value === '') return null;

  const variant = cellOpts?.variant;

  if (!variant) {
    return <span className="truncate">{String(value)}</span>;
  }

  switch (variant) {
    case 'short-text':

    case 'long-text':
      return <span className="truncate">{String(value)}</span>;

    case 'email':
      return (
        <a
          href={`mailto:${String(value)}`}
          className="truncate text-primary hover:underline">
          {String(value)}
        </a>
      );

    case 'phone':
      return <span className="truncate">{String(value)}</span>;

    case 'url':
      return (
        <a
          href={getUrlHref(String(value))}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-primary hover:underline">
          {String(value)}
        </a>
      );

    case 'number':

    case 'currency':

    case 'percent':
      return (
        <span className="truncate tabular-nums">
          {formatNumberDisplayValue({
            value: String(value),
            variant,
            currency: variant === 'currency' ? cellOpts.currency : undefined
          })}
        </span>
      );

    case 'duration':
      return (
        <span className="truncate tabular-nums">
          {formatDuration(typeof value === 'number' ? value : Number(value))}
        </span>
      );

    case 'select':

    case 'status': {
      const options: Array<CellSelectOption> = cellOpts.options ?? [];
      const option = options.find(o => o.value === String(value));

      return (
        <Badge
          variant="outline"
          className="max-w-full truncate"
          style={option?.color ? { borderColor: option.color, color: option.color } : undefined}>
          {option?.label ?? String(value)}
        </Badge>
      );
    }

    case 'enum': {
      const options: Array<CellSelectOption> = cellOpts.options ?? [];
      const option = options.find(o => o.value === String(value));

      return (
        <Badge variant="outline" className="max-w-full truncate">
          {option?.label ?? String(value)}
        </Badge>
      );
    }

    case 'multi-select':

    case 'tag-select': {
      const options: Array<CellSelectOption> = cellOpts.options ?? [];
      const values = Array.isArray(value) ? value : [value];

      return (
        <div className="flex flex-wrap gap-1">
          {values.slice(0, 5).map((v) => {
            const option = options.find(o => o.value === String(v));

            return (
              <Badge
                key={String(v)}
                variant="outline"
                className="max-w-full truncate"
                style={option?.color ? { borderColor: option.color, color: option.color } : undefined}>
                {option?.label ?? String(v)}
              </Badge>
            );
          })}
          {values.length > 5 && (
            <Badge variant="secondary" className="tabular-nums">
              +{values.length - 5}
            </Badge>
          )}
        </div>
      );
    }

    case 'user': {
      const options: Array<CellUserOption> = cellOpts.options ?? [];
      const option = options.find(o => o.value === String(value));
      const label = option?.label ?? String(value);

      return (
        <div className="flex items-center gap-2">
          <Avatar className="size-5 rounded-md">
            {option?.avatarUrl
              ? <AvatarImage src={option.avatarUrl} alt={label} />
              : null}
            <AvatarFallback className="rounded-md text-[10px]">
              {getInitials(label, option?.initials)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{label}</span>
        </div>
      );
    }

    case 'user-multi-select': {
      const options: Array<CellUserOption> = cellOpts.options ?? [];
      const values = Array.isArray(value) ? value : [value];

      return (
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            {values.slice(0, 4).map((v) => {
              const option = options.find(o => o.value === String(v));
              const label = option?.label ?? String(v);

              return (
                <Avatar key={String(v)} className="size-5 rounded-md ring-2 ring-background">
                  {option?.avatarUrl
                    ? <AvatarImage src={option.avatarUrl} alt={label} />
                    : null}
                  <AvatarFallback className="rounded-md text-[10px]">
                    {getInitials(label, option?.initials)}
                  </AvatarFallback>
                </Avatar>
              );
            })}
          </div>
          {values.length > 4 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              +{values.length - 4}
            </span>
          )}
        </div>
      );
    }

    case 'checkbox':

    case 'switch':
      return value
        ? <Check className="size-4 text-primary" />
        : <X className="size-4 text-muted-foreground" />;

    case 'date':
      return (
        <span className="truncate">
          {formatDateForDisplay(value)}
        </span>
      );

    case 'datetime':
      return (
        <span className="truncate">
          {formatDateTimeForDisplay(String(value))}
        </span>
      );

    case 'time':
      return (
        <span className="truncate">
          {formatTime(String(value))}
        </span>
      );

    case 'date-range': {
      const range = parseDateRange(String(value));

      if (!range) return <span className="truncate">{String(value)}</span>;

      return (
        <span className="truncate">
          {formatDateRange(range.start, range.end)}
        </span>
      );
    }

    case 'rating': {
      const max = cellOpts.max ?? 5;
      const numValue = typeof value === 'number' ? value : Number(value);
      const filledCount = Number.isNaN(numValue) ? 0 : Math.round(numValue);

      return (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: max }, (_, i) => (
            <Star
              key={i}
              className={cn(
                'size-3.5',
                i < filledCount
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground/30'
              )} />
          ))}
        </div>
      );
    }

    case 'color':
      return (
        <div className="flex items-center gap-2">
          <div
            className="size-4 rounded-sm border"
            style={{ backgroundColor: String(value) }} />
          <span className="truncate text-xs">{String(value)}</span>
        </div>
      );

    case 'image': {
      const src = typeof value === 'string' ? value : undefined;

      if (!src) return null;

      return (
        <img
          src={src}
          alt=""
          className="h-10 w-auto rounded-sm object-cover" />
      );
    }

    case 'icon':
      return <span className="truncate">{String(value)}</span>;

    case 'currency-code':
      return <span className="truncate font-mono">{String(value)}</span>;

    case 'file': {
      if (Array.isArray(value)) {
        const files = value.filter(
          (item): item is FileCellData => !!item && typeof item === 'object' && 'name' in item
        );

        if (files.length === 0) return null;

        return (
          <div className="flex items-center gap-1">
            {files.slice(0, 3).map((file) => {
              const Icon = getFileIcon(file.type);

              return (
                <div key={file.id} className="flex items-center gap-1 text-xs">
                  <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="max-w-20 truncate">{file.name}</span>
                </div>
              );
            })}
            {files.length > 3 && (
              <span className="text-xs text-muted-foreground tabular-nums">
                +{files.length - 3}
              </span>
            )}
          </div>
        );
      }

      return <span className="truncate">{String(value)}</span>;
    }

    case 'relation':
      return <span className="truncate">{String(value)}</span>;

    default:
      return <span className="truncate">{String(value)}</span>;
  }
}