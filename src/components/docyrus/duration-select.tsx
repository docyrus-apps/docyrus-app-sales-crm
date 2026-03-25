'use client';

import { useMemo, useState } from 'react';

import { type ReactNode } from 'react';

import { Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

import { cn } from '@/lib/utils';

import { tUi, type UiI18nLocale } from '@/lib/ui-i18n';

export type DurationFormat = 'HH:MM' | 'compact' | 'decimal';

export interface DurationSelectProps {
  /** Duration value in seconds */
  value: number | null | undefined;
  /** Called with seconds when a duration is selected, or null when cleared */
  onChange: (seconds: number | null) => void;
  /** Display format for the trigger label */
  format?: DurationFormat;
  /** Minute increment for grid columns (e.g. 5, 6, 10) */
  minuteIncrement?: number;
  /** Maximum hours shown in the grid */
  maxHours?: number;
  disabled?: boolean;
  /** Whether the field is in an invalid/error state */
  invalid?: boolean;
  placeholder?: string;
  className?: string;
  locale?: UiI18nLocale;
}

function formatHHMM(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatCompact(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);

  if (h === 0 && m === 0) return '0h 0m';
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h 0m`;

  return `${h}h ${m}m`;
}

function formatDecimal(totalSeconds: number): string {
  return `${(totalSeconds / 3600).toFixed(2)}h`;
}

export function formatDurationDisplay(
  totalSeconds: number,
  fmt: DurationFormat
): string {
  switch (fmt) {
    case 'compact':
      return formatCompact(totalSeconds);

    case 'decimal':
      return formatDecimal(totalSeconds);

    case 'HH:MM':

    default:
      return formatHHMM(totalSeconds);
  }
}

function buildMinuteColumns(increment: number): Array<number> {
  const cols: Array<number> = [];
  let m = increment;

  while (m < 60) {
    cols.push(m);
    m += increment;
  }

  return cols;
}

export function DurationSelect({
  value,
  onChange,
  format = 'compact',
  minuteIncrement = 5,
  maxHours = 8,
  disabled = false,
  invalid = false,
  placeholder,
  className,
  locale = 'en'
}: DurationSelectProps) {
  const [open, setOpen] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  const minuteCols = useMemo(
    () => buildMinuteColumns(minuteIncrement),
    [minuteIncrement]
  );

  const hourRows = useMemo(
    () => Array.from({ length: maxHours + 1 }, (_, i) => i),
    [maxHours]
  );

  const selectedHours
    = value != null && value >= 0 ? Math.floor(value / 3600) : null;
  const selectedMinutes
    = value != null && value >= 0 ? Math.floor((value % 3600) / 60) : null;

  const handleSelect = (hours: number, minutes: number) => {
    onChange(hours * 3600 + minutes * 60);
    setOpen(false);
  };

  const triggerLabel
    = value != null && value >= 0 ? formatDurationDisplay(value, format) : null;

  const getRowLabel = (h: number, rowIdx: number): ReactNode => {
    const isHovered = hoveredRow === rowIdx;
    const isSelected = selectedHours === h;

    if (isHovered && hoveredCol !== null) {
      const m = minuteCols[hoveredCol] ?? 0;

      return (
        <span className="font-semibold text-foreground">
          {formatCompact(h * 3600 + m * 60)}
        </span>
      );
    }

    if (isSelected && selectedMinutes != null && selectedMinutes > 0 && value != null) {
      return (
        <span className="font-semibold text-foreground">
          {formatCompact(value)}
        </span>
      );
    }

    return `${h}h 0m`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          aria-invalid={invalid || undefined}
          className={cn(
            'w-full justify-start text-left font-normal',
            !triggerLabel && 'text-muted-foreground',
            className
          )}>
          <Clock className="mr-2 size-4 shrink-0" />
          {triggerLabel ?? placeholder ?? '0h 0m'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div
          className="grid gap-px p-2"
          style={{
            gridTemplateColumns: `5rem repeat(${minuteCols.length}, 2rem)`
          }}
          onMouseLeave={() => {
            setHoveredRow(null);
            setHoveredCol(null);
          }}
          role="grid"
          aria-label={tUi(locale, 'durationPicker')}>
          {/* Corner cell */}
          <div className="h-7" />

          {/* Column headers */}
          {minuteCols.map((m, colIdx) => (
            <div
              key={m}
              className={cn(
                'flex h-7 items-center justify-center text-[11px] tabular-nums select-none',
                hoveredCol === colIdx ? 'font-medium text-foreground' : 'text-muted-foreground'
              )}>
              {String(m).padStart(2, '0')}
            </div>
          ))}

          {/* Data rows */}
          {hourRows.map((h, rowIdx) => {
            const isRowHovered = hoveredRow === rowIdx;
            const isRowSelected = selectedHours === h;

            return (
              <GridRow key={h}>
                {/* Row header */}
                <button
                  type="button"
                  onClick={() => handleSelect(h, 0)}
                  onMouseEnter={() => {
                    setHoveredRow(rowIdx);
                    setHoveredCol(null);
                  }}
                  aria-label={`${h} ${tUi(locale, 'hours')}`}
                  className={cn(
                    'flex h-7 items-center rounded-sm px-1.5 text-left text-xs tabular-nums transition-colors',
                    isRowSelected && selectedMinutes === 0 ? 'bg-primary font-semibold text-primary-foreground' : isRowHovered ? 'bg-accent/60 font-medium text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}>
                  {getRowLabel(h, rowIdx)}
                </button>

                {/* Minute cells */}
                {minuteCols.map((m, colIdx) => {
                  const isCellSelected = isRowSelected && selectedMinutes === m;
                  const isInHoveredRow = isRowHovered;
                  const isInHoveredCol = hoveredCol === colIdx;
                  const isIntersection = isInHoveredRow && isInHoveredCol;

                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelect(h, m)}
                      onMouseEnter={() => {
                        setHoveredRow(rowIdx);
                        setHoveredCol(colIdx);
                      }}
                      aria-label={`${h} ${tUi(locale, 'hours')} ${m} minutes`}
                      className={cn(
                        'flex h-7 items-center justify-center rounded-sm text-[11px] tabular-nums transition-colors',
                        isCellSelected ? 'bg-primary font-semibold text-primary-foreground' : isIntersection ? 'bg-accent/70 text-accent-foreground' : isInHoveredRow || isInHoveredCol ? 'bg-accent/40 text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                      )}>
                      {String(m).padStart(2, '0')}
                    </button>
                  );
                })}
              </GridRow>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t px-2 py-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}>
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Fragment wrapper for grid rows to keep keys clean */
function GridRow({ children }: { children: ReactNode }): ReactNode {
  return children;
}