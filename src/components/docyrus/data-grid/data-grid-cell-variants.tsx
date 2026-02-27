'use client';

import {
  useCallback, useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type ComponentProps, type DragEvent, type FormEvent, type KeyboardEvent, type MouseEvent
} from 'react';

import {
  Check, Clock, Star, Upload, X
} from 'lucide-react';
import { toast } from 'sonner';

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command';
import { Popover, PopoverAnchor, PopoverContent as PopoverContentBase } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { cn } from '@/lib/utils';

import { useBadgeOverflow } from './hooks/use-badge-overflow';
import { useDebouncedCallback } from './hooks/use-debounced-callback';
import {
  formatDateForDisplay,
  formatDateToString,
  formatFileSize,
  getCellKey,
  getFileIcon,
  getLineCount,
  getUrlHref,
  parseLocalDate
} from './lib/data-grid';
import { DataGridCellWrapper } from './data-grid-cell-wrapper';
import {
  type CellSelectOption,
  type CellUserOption,
  type DataGridCellProps,
  type FileCellData
} from './types';
import {
  COMMON_CURRENCIES,
  formatDateRange,
  formatDuration,
  getCurrencySymbol,
  parseDateRange,
  parseDuration
} from './lib/utils';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9()\-\s]{5,}$/;

function PopoverContent(props: ComponentProps<typeof PopoverContentBase>) {
  return <PopoverContentBase updatePositionStrategy="always" {...props} />;
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

  if (variant === 'percent') {
    return `${parsedValue}%`;
  }

  return value;
}

function toDateTimeLocalInputValue(value: unknown): string {
  if (!value) return '';

  const parsed
    = value instanceof Date
      ? value
      : typeof value === 'string'
        ? new Date(value)
        : null;

  if (!parsed) return '';
  if (Number.isNaN(parsed.getTime())) return '';

  const offsetMs = parsed.getTimezoneOffset() * 60_000;

  return new Date(parsed.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatDateTimeForDisplay(value: string): string {
  if (!value) return '';

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString();
}

function sanitizePhoneValue(value: string): string {
  return value.replace(/[^+\d]/g, '');
}

function getInitials(value: string, fallback?: string): string {
  const fallbackValue = fallback?.trim().toUpperCase();

  if (fallbackValue) {
    return fallbackValue.slice(0, 2);
  }

  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return 'U';

  if (parts.length === 1) {
    return parts[0]?.slice(0, 2).toUpperCase() ?? 'U';
  }

  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  const initials = `${first}${last}`.toUpperCase();

  return initials || 'U';
}

interface UserOptionDisplayProps {
  label: string;
  avatarUrl?: string;
  initials?: string;
}

function UserOptionDisplay({
  label,
  avatarUrl,
  initials
}: UserOptionDisplayProps) {
  const resolvedInitials = getInitials(label, initials);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar className="size-5 rounded-md">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={label} /> : null}
        <AvatarFallback className="rounded-md text-[10px] uppercase">
          {resolvedInitials}
        </AvatarFallback>
      </Avatar>
      <span className="truncate">{label}</span>
    </div>
  );
}

export function ShortTextCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isEditing,
  isFocused,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly
}: DataGridCellProps<TData>) {
  const initialValue = cell.getValue() as string;
  const [value, setValue] = useState(initialValue);
  const cellRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const prevInitialValueRef = useRef(initialValue);

  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(initialValue);
    if (cellRef.current && !isEditing) {
      cellRef.current.textContent = initialValue;
    }
  }

  const onBlur = useCallback(() => {
    const currentValue = cellRef.current?.textContent ?? '';

    if (!readOnly && currentValue !== initialValue) {
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: currentValue });
    }
    tableMeta?.onCellEditingStop?.();
  }, [
    tableMeta,
    rowIndex,
    columnId,
    initialValue,
    readOnly
  ]);

  const onInput = useCallback(
    (event: FormEvent<HTMLDivElement>) => {
      const currentValue = event.currentTarget.textContent ?? '';

      setValue(currentValue);
    },
    []
  );

  const onWrapperKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (isEditing) {
        if (event.key === 'Enter') {
          event.preventDefault();
          const currentValue = cellRef.current?.textContent ?? '';

          if (currentValue !== initialValue) {
            tableMeta?.onDataUpdate?.({
              rowIndex,
              columnId,
              value: currentValue
            });
          }
          tableMeta?.onCellEditingStop?.({ moveToNextRow: true });
        } else if (event.key === 'Tab') {
          event.preventDefault();
          const currentValue = cellRef.current?.textContent ?? '';

          if (currentValue !== initialValue) {
            tableMeta?.onDataUpdate?.({
              rowIndex,
              columnId,
              value: currentValue
            });
          }
          tableMeta?.onCellEditingStop?.({
            direction: event.shiftKey ? 'left' : 'right'
          });
        } else if (event.key === 'Escape') {
          event.preventDefault();
          setValue(initialValue);
          cellRef.current?.blur();
        }
      } else if (
        isFocused
        && event.key.length === 1
        && !event.ctrlKey
        && !event.metaKey
      ) {
        setValue(event.key);

        queueMicrotask(() => {
          if (cellRef.current && cellRef.current.contentEditable === 'true') {
            cellRef.current.textContent = event.key;
            const range = document.createRange();
            const selection = window.getSelection();

            range.selectNodeContents(cellRef.current);
            range.collapse(false);
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
        });
      }
    },
    [
      isEditing,
      isFocused,
      initialValue,
      tableMeta,
      rowIndex,
      columnId
    ]
  );

  useEffect(() => {
    if (isEditing && cellRef.current) {
      cellRef.current.focus();

      if (!cellRef.current.textContent && value) {
        cellRef.current.textContent = value;
      }

      if (cellRef.current.textContent) {
        const range = document.createRange();
        const selection = window.getSelection();

        range.selectNodeContents(cellRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  }, [isEditing, value]);

  const displayValue = !isEditing ? (value ?? '') : '';

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      isChanged={isChanged}
      readOnly={readOnly}
      onKeyDown={onWrapperKeyDown}>
      <div
        role="textbox"
        data-slot="grid-cell-content"
        contentEditable={isEditing}
        tabIndex={-1}
        ref={cellRef}
        onBlur={onBlur}
        onInput={onInput}
        suppressContentEditableWarning
        className={cn('size-full overflow-hidden outline-none', {
          'whitespace-nowrap **:inline **:whitespace-nowrap [&_br]:hidden':
            isEditing
        })}>
        {displayValue}
      </div>
    </DataGridCellWrapper>
  );
}

export function LongTextCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly
}: DataGridCellProps<TData>) {
  const initialValue = cell.getValue() as string;
  const [value, setValue] = useState(initialValue ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingCharRef = useRef<string | null>(null);
  const sideOffset = -(containerRef.current?.clientHeight ?? 0);

  const prevInitialValueRef = useRef(initialValue);

  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(initialValue ?? '');
  }

  const debouncedSave = useDebouncedCallback((newValue: string) => {
    if (!readOnly) {
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: newValue });
    }
  }, 300);

  const onSave = useCallback(() => {
    if (!readOnly && value !== initialValue) {
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value });
    }
    tableMeta?.onCellEditingStop?.();
  }, [
    tableMeta,
    value,
    initialValue,
    rowIndex,
    columnId,
    readOnly
  ]);

  const onCancel = useCallback(() => {
    setValue(initialValue ?? '');
    if (!readOnly) {
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: initialValue });
    }
    tableMeta?.onCellEditingStop?.();
  }, [
    tableMeta,
    initialValue,
    rowIndex,
    columnId,
    readOnly
  ]);

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open && !readOnly) {
        tableMeta?.onCellEditingStart?.(rowIndex, columnId);
      } else {
        if (!readOnly && value !== initialValue) {
          tableMeta?.onDataUpdate?.({ rowIndex, columnId, value });
        }
        tableMeta?.onCellEditingStop?.();
      }
    },
    [
      tableMeta,
      value,
      initialValue,
      rowIndex,
      columnId,
      readOnly
    ]
  );

  const onOpenAutoFocus: NonNullable<
    ComponentProps<typeof PopoverContent>['onOpenAutoFocus']
  > = useCallback((event) => {
    event.preventDefault();
    if (textareaRef.current) {
      textareaRef.current.focus();
      const { length } = textareaRef.current.value;

      textareaRef.current.setSelectionRange(length, length);

      /*
       * Insert pending character using execCommand so it's part of undo history
       * Use requestAnimationFrame to ensure focus has fully settled
       */
      if (pendingCharRef.current) {
        const char = pendingCharRef.current;

        pendingCharRef.current = null;
        requestAnimationFrame(() => {
          if (
            textareaRef.current
            && document.activeElement === textareaRef.current
          ) {
            document.execCommand('insertText', false, char);
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
          }
        });
      } else {
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      }
    }
  }, []);

  const onWrapperKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (
        isFocused
        && !isEditing
        && !readOnly
        && event.key.length === 1
        && !event.ctrlKey
        && !event.metaKey
      ) {
        /*
         * Store the character to be inserted after textarea focuses
         * This ensures it's part of the textarea's undo history
         */
        pendingCharRef.current = event.key;
      }
    },
    [isFocused, isEditing, readOnly]
  );

  const onBlur = useCallback(() => {
    if (!readOnly && value !== initialValue) {
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value });
    }
    tableMeta?.onCellEditingStop?.();
  }, [
    tableMeta,
    value,
    initialValue,
    rowIndex,
    columnId,
    readOnly
  ]);

  const onChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value;

      setValue(newValue);
      debouncedSave(newValue);
    },
    [debouncedSave]
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        onSave();
      } else if (event.key === 'Tab') {
        event.preventDefault();
        if (value !== initialValue) {
          tableMeta?.onDataUpdate?.({ rowIndex, columnId, value });
        }
        tableMeta?.onCellEditingStop?.({
          direction: event.shiftKey ? 'left' : 'right'
        });

        return;
      }
      event.stopPropagation();
    },
    [
      onSave,
      onCancel,
      value,
      initialValue,
      tableMeta,
      rowIndex,
      columnId
    ]
  );

  return (
    <Popover open={isEditing} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>
        <DataGridCellWrapper<TData>
          ref={containerRef}
          cell={cell}
          tableMeta={tableMeta}
          rowIndex={rowIndex}
          columnId={columnId}
          rowHeight={rowHeight}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          isSearchMatch={isSearchMatch}
          isActiveSearchMatch={isActiveSearchMatch}
          isChanged={isChanged}
          readOnly={readOnly}
          onKeyDown={onWrapperKeyDown}>
          <span data-slot="grid-cell-content">{value}</span>
        </DataGridCellWrapper>
      </PopoverAnchor>
      <PopoverContent
        data-grid-cell-editor=""
        align="start"
        side="bottom"
        sideOffset={sideOffset}
        className="w-[400px] rounded-none p-0"
        onOpenAutoFocus={onOpenAutoFocus}>
        <Textarea
          placeholder="Enter text..."
          className="max-h-[300px] min-h-[150px] resize-none overflow-y-auto rounded-none border-0 shadow-none focus-visible:ring-1 focus-visible:ring-ring"
          ref={textareaRef}
          value={value}
          onBlur={onBlur}
          onChange={onChange}
          onKeyDown={onKeyDown} />
      </PopoverContent>
    </Popover>
  );
}

export function NumberCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly
}: DataGridCellProps<TData>) {
  const initialValue = cell.getValue() as number;
  const [value, setValue] = useState(String(initialValue ?? ''));
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const cellOpts = cell.column.columnDef.meta?.cell;
  const numberCellOpts
    = cellOpts?.variant === 'number'
      || cellOpts?.variant === 'currency'
      || cellOpts?.variant === 'percent'
      ? cellOpts
      : null;
  const min = numberCellOpts?.min;
  const max = numberCellOpts?.max;
  const step = numberCellOpts?.step;
  const displayVariant = cellOpts?.variant ?? 'number';

  const prevIsEditingRef = useRef(isEditing);

  const prevInitialValueRef = useRef(initialValue);

  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(String(initialValue ?? ''));
  }

  const onBlur = useCallback(() => {
    const numValue = value === '' ? null : Number(value);

    if (!readOnly && numValue !== initialValue) {
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: numValue });
    }
    tableMeta?.onCellEditingStop?.();
  }, [
    tableMeta,
    rowIndex,
    columnId,
    initialValue,
    value,
    readOnly
  ]);

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value);
    },
    []
  );

  const onWrapperKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (isEditing) {
        if (event.key === 'Enter') {
          event.preventDefault();
          const numValue = value === '' ? null : Number(value);

          if (numValue !== initialValue) {
            tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: numValue });
          }
          tableMeta?.onCellEditingStop?.({ moveToNextRow: true });
        } else if (event.key === 'Tab') {
          event.preventDefault();
          const numValue = value === '' ? null : Number(value);

          if (numValue !== initialValue) {
            tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: numValue });
          }
          tableMeta?.onCellEditingStop?.({
            direction: event.shiftKey ? 'left' : 'right'
          });
        } else if (event.key === 'Escape') {
          event.preventDefault();
          setValue(String(initialValue ?? ''));
          inputRef.current?.blur();
        }
      } else if (isFocused) {
        if (event.key === 'Backspace') {
          setValue('');
        } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
          setValue(event.key);
        }
      }
    },
    [
      isEditing,
      isFocused,
      initialValue,
      tableMeta,
      rowIndex,
      columnId,
      value
    ]
  );

  useEffect(() => {
    const wasEditing = prevIsEditingRef.current;

    prevIsEditingRef.current = isEditing;

    if (isEditing && !wasEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const displayValue = useMemo(() => {
    if (
      displayVariant !== 'number'
      && displayVariant !== 'currency'
      && displayVariant !== 'percent'
    ) {
      return value;
    }

    return formatNumberDisplayValue({
      value,
      variant: displayVariant,
      currency:
        numberCellOpts?.variant === 'currency'
          ? numberCellOpts.currency
          : undefined
    });
  }, [displayVariant, numberCellOpts, value]);

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      isChanged={isChanged}
      readOnly={readOnly}
      onKeyDown={onWrapperKeyDown}>
      {isEditing ? (
        <input
          type="number"
          ref={inputRef}
          value={value}
          min={min}
          max={max}
          step={step}
          className="w-full border-none bg-transparent p-0 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          onBlur={onBlur}
          onChange={onChange} />
      ) : (
        <span data-slot="grid-cell-content">{displayValue}</span>
      )}
    </DataGridCellWrapper>
  );
}

export function CurrencyCell<TData>(props: DataGridCellProps<TData>) {
  return <NumberCell {...props} />;
}

export function PercentCell<TData>(props: DataGridCellProps<TData>) {
  return <NumberCell {...props} />;
}

export function EmailCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly
}: DataGridCellProps<TData>) {
  const initialValue = (cell.getValue() as string) ?? '';
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const prevIsEditingRef = useRef(isEditing);
  const prevInitialValueRef = useRef(initialValue);

  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(initialValue);
  }

  const commitValue = useCallback(
    (nextValue: string): boolean => {
      const normalizedValue = nextValue.trim();

      if (normalizedValue && !EMAIL_REGEX.test(normalizedValue)) {
        toast.error('Invalid email address');
        setValue(initialValue);

        return false;
      }

      const finalValue = normalizedValue || null;
      const initialNormalizedValue = initialValue.trim() || null;

      if (!readOnly && finalValue !== initialNormalizedValue) {
        tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: finalValue });
      }

      return true;
    },
    [
      columnId,
      initialValue,
      readOnly,
      rowIndex,
      tableMeta
    ]
  );

  const onBlur = useCallback(() => {
    commitValue(value);
    tableMeta?.onCellEditingStop?.();
  }, [commitValue, tableMeta, value]);

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value);
    },
    []
  );

  const onWrapperKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (isEditing) {
        if (event.key === 'Enter') {
          event.preventDefault();
          if (commitValue(value)) {
            tableMeta?.onCellEditingStop?.({ moveToNextRow: true });
          }

          return;
        }

        if (event.key === 'Tab') {
          event.preventDefault();
          if (commitValue(value)) {
            tableMeta?.onCellEditingStop?.({
              direction: event.shiftKey ? 'left' : 'right'
            });
          }

          return;
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          setValue(initialValue);
          inputRef.current?.blur();
        }
      } else if (isFocused) {
        if (event.key === 'Backspace') {
          setValue('');
        } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
          setValue(event.key);
        }
      }
    },
    [
      commitValue,
      initialValue,
      isEditing,
      isFocused,
      tableMeta,
      value
    ]
  );

  useEffect(() => {
    const wasEditing = prevIsEditingRef.current;

    prevIsEditingRef.current = isEditing;

    if (isEditing && !wasEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      isChanged={isChanged}
      readOnly={readOnly}
      onKeyDown={onWrapperKeyDown}>
      {isEditing ? (
        <input
          ref={inputRef}
          type="email"
          value={value}
          className="w-full border-none bg-transparent p-0 outline-none"
          onChange={onChange}
          onBlur={onBlur} />
      ) : value ? (
        <a
          data-slot="grid-cell-content"
          href={`mailto:${value}`}
          className="truncate text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary/60"
          onClick={(event) => {
            if (event.ctrlKey || event.metaKey) {
              event.stopPropagation();
            } else {
              event.preventDefault();
            }
          }}>
          {value}
        </a>
      ) : (
        <span data-slot="grid-cell-content" />
      )}
    </DataGridCellWrapper>
  );
}

export function PhoneCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly
}: DataGridCellProps<TData>) {
  const initialValue = (cell.getValue() as string) ?? '';
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const prevIsEditingRef = useRef(isEditing);
  const prevInitialValueRef = useRef(initialValue);

  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(initialValue);
  }

  const commitValue = useCallback(
    (nextValue: string): boolean => {
      const normalizedValue = nextValue.trim();

      if (normalizedValue && !PHONE_REGEX.test(normalizedValue)) {
        toast.error('Invalid phone number');
        setValue(initialValue);

        return false;
      }

      const finalValue = normalizedValue || null;
      const initialNormalizedValue = initialValue.trim() || null;

      if (!readOnly && finalValue !== initialNormalizedValue) {
        tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: finalValue });
      }

      return true;
    },
    [
      columnId,
      initialValue,
      readOnly,
      rowIndex,
      tableMeta
    ]
  );

  const onBlur = useCallback(() => {
    commitValue(value);
    tableMeta?.onCellEditingStop?.();
  }, [commitValue, tableMeta, value]);

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value);
    },
    []
  );

  const onWrapperKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (isEditing) {
        if (event.key === 'Enter') {
          event.preventDefault();
          if (commitValue(value)) {
            tableMeta?.onCellEditingStop?.({ moveToNextRow: true });
          }

          return;
        }

        if (event.key === 'Tab') {
          event.preventDefault();
          if (commitValue(value)) {
            tableMeta?.onCellEditingStop?.({
              direction: event.shiftKey ? 'left' : 'right'
            });
          }

          return;
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          setValue(initialValue);
          inputRef.current?.blur();
        }
      } else if (isFocused) {
        if (event.key === 'Backspace') {
          setValue('');
        } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
          setValue(event.key);
        }
      }
    },
    [
      commitValue,
      initialValue,
      isEditing,
      isFocused,
      tableMeta,
      value
    ]
  );

  useEffect(() => {
    const wasEditing = prevIsEditingRef.current;

    prevIsEditingRef.current = isEditing;

    if (isEditing && !wasEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const telHref = sanitizePhoneValue(value);

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      isChanged={isChanged}
      readOnly={readOnly}
      onKeyDown={onWrapperKeyDown}>
      {isEditing ? (
        <input
          ref={inputRef}
          type="tel"
          value={value}
          className="w-full border-none bg-transparent p-0 outline-none"
          onChange={onChange}
          onBlur={onBlur} />
      ) : value ? (
        <a
          data-slot="grid-cell-content"
          href={telHref ? `tel:${telHref}` : undefined}
          className="truncate text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary/60"
          onClick={(event) => {
            if (event.ctrlKey || event.metaKey) {
              event.stopPropagation();
            } else {
              event.preventDefault();
            }
          }}>
          {value}
        </a>
      ) : (
        <span data-slot="grid-cell-content" />
      )}
    </DataGridCellWrapper>
  );
}

export function UrlCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isEditing,
  isFocused,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly
}: DataGridCellProps<TData>) {
  const initialValue = cell.getValue() as string;
  const [value, setValue] = useState(initialValue ?? '');
  const cellRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const prevInitialValueRef = useRef(initialValue);

  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(initialValue ?? '');
    if (cellRef.current && !isEditing) {
      cellRef.current.textContent = initialValue ?? '';
    }
  }

  const onBlur = useCallback(() => {
    const currentValue = cellRef.current?.textContent?.trim() ?? '';

    if (!readOnly && currentValue !== initialValue) {
      tableMeta?.onDataUpdate?.({
        rowIndex,
        columnId,
        value: currentValue || null
      });
    }
    tableMeta?.onCellEditingStop?.();
  }, [
    tableMeta,
    rowIndex,
    columnId,
    initialValue,
    readOnly
  ]);

  const onInput = useCallback(
    (event: FormEvent<HTMLDivElement>) => {
      const currentValue = event.currentTarget.textContent ?? '';

      setValue(currentValue);
    },
    []
  );

  const onWrapperKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (isEditing) {
        if (event.key === 'Enter') {
          event.preventDefault();
          const currentValue = cellRef.current?.textContent?.trim() ?? '';

          if (!readOnly && currentValue !== initialValue) {
            tableMeta?.onDataUpdate?.({
              rowIndex,
              columnId,
              value: currentValue || null
            });
          }
          tableMeta?.onCellEditingStop?.({ moveToNextRow: true });
        } else if (event.key === 'Tab') {
          event.preventDefault();
          const currentValue = cellRef.current?.textContent?.trim() ?? '';

          if (!readOnly && currentValue !== initialValue) {
            tableMeta?.onDataUpdate?.({
              rowIndex,
              columnId,
              value: currentValue || null
            });
          }
          tableMeta?.onCellEditingStop?.({
            direction: event.shiftKey ? 'left' : 'right'
          });
        } else if (event.key === 'Escape') {
          event.preventDefault();
          setValue(initialValue ?? '');
          cellRef.current?.blur();
        }
      } else if (
        isFocused
        && !readOnly
        && event.key.length === 1
        && !event.ctrlKey
        && !event.metaKey
      ) {
        setValue(event.key);

        queueMicrotask(() => {
          if (cellRef.current && cellRef.current.contentEditable === 'true') {
            cellRef.current.textContent = event.key;
            const range = document.createRange();
            const selection = window.getSelection();

            range.selectNodeContents(cellRef.current);
            range.collapse(false);
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
        });
      }
    },
    [
      isEditing,
      isFocused,
      initialValue,
      tableMeta,
      rowIndex,
      columnId,
      readOnly
    ]
  );

  const onLinkClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (isEditing) {
        event.preventDefault();

        return;
      }

      const href = getUrlHref(value);

      if (!href) {
        event.preventDefault();
        toast.error('Invalid URL', {
          description:
            'URL contains a dangerous protocol (javascript:, data:, vbscript:, or file:)'
        });

        return;
      }

      event.stopPropagation();
    },
    [isEditing, value]
  );

  useEffect(() => {
    if (isEditing && cellRef.current) {
      cellRef.current.focus();

      if (!cellRef.current.textContent && value) {
        cellRef.current.textContent = value;
      }

      if (cellRef.current.textContent) {
        const range = document.createRange();
        const selection = window.getSelection();

        range.selectNodeContents(cellRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  }, [isEditing, value]);

  const displayValue = !isEditing ? (value ?? '') : '';
  const urlHref = displayValue ? getUrlHref(displayValue) : '';
  const isDangerousUrl = displayValue && !urlHref;

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      isChanged={isChanged}
      readOnly={readOnly}
      onKeyDown={onWrapperKeyDown}>
      {!isEditing && displayValue ? (
        <div
          data-slot="grid-cell-content"
          className="size-full overflow-hidden">
          <a
            data-focused={isFocused && !isDangerousUrl ? '' : undefined}
            data-invalid={isDangerousUrl ? '' : undefined}
            href={urlHref}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary/60 data-invalid:cursor-not-allowed data-focused:text-foreground data-invalid:text-destructive data-focused:decoration-foreground/50 data-invalid:decoration-destructive/50 data-focused:hover:decoration-foreground/70 data-invalid:hover:decoration-destructive/70"
            onClick={onLinkClick}>
            {displayValue}
          </a>
        </div>
      ) : (
        <div
          role="textbox"
          data-slot="grid-cell-content"
          contentEditable={isEditing}
          tabIndex={-1}
          ref={cellRef}
          onBlur={onBlur}
          onInput={onInput}
          suppressContentEditableWarning
          className={cn('size-full overflow-hidden outline-none', {
            'whitespace-nowrap **:inline **:whitespace-nowrap [&_br]:hidden':
              isEditing
          })}>
          {displayValue}
        </div>
      )}
    </DataGridCellWrapper>
  );
}

export function CheckboxCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly
}: Omit<DataGridCellProps<TData>, 'isEditing'>) {
  const initialValue = cell.getValue() as boolean;
  const [value, setValue] = useState(Boolean(initialValue));
  const containerRef = useRef<HTMLDivElement>(null);

  const prevInitialValueRef = useRef(initialValue);

  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(Boolean(initialValue));
  }

  const onCheckedChange = useCallback(
    (checked: boolean) => {
      if (readOnly) return;
      setValue(checked);
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: checked });
    },
    [
      tableMeta,
      rowIndex,
      columnId,
      readOnly
    ]
  );

  const onWrapperKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (
        isFocused
        && !readOnly
        && (event.key === ' ' || event.key === 'Enter')
      ) {
        event.preventDefault();
        event.stopPropagation();
        onCheckedChange(!value);
      } else if (isFocused && event.key === 'Tab') {
        event.preventDefault();
        tableMeta?.onCellEditingStop?.({
          direction: event.shiftKey ? 'left' : 'right'
        });
      }
    },
    [
      isFocused,
      value,
      onCheckedChange,
      tableMeta,
      readOnly
    ]
  );

  const onWrapperClick = useCallback(
    (event: MouseEvent) => {
      if (isFocused && !readOnly) {
        event.preventDefault();
        event.stopPropagation();
        onCheckedChange(!value);
      }
    },
    [
      isFocused,
      value,
      onCheckedChange,
      readOnly
    ]
  );

  const onCheckboxClick = useCallback((event: MouseEvent) => {
    event.stopPropagation();
  }, []);

  const onCheckboxMouseDown = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
    },
    []
  );

  const onCheckboxDoubleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
    },
    []
  );

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={false}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      isChanged={isChanged}
      readOnly={readOnly}
      className="flex size-full justify-center"
      onClick={onWrapperClick}
      onKeyDown={onWrapperKeyDown}>
      <Checkbox
        checked={value}
        onCheckedChange={onCheckedChange}
        disabled={readOnly}
        className="border-primary"
        onClick={onCheckboxClick}
        onMouseDown={onCheckboxMouseDown}
        onDoubleClick={onCheckboxDoubleClick} />
    </DataGridCellWrapper>
  );
}

export function SelectCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly
}: DataGridCellProps<TData>) {
  const initialValue = cell.getValue() as string;
  const [value, setValue] = useState(initialValue);
  const containerRef = useRef<HTMLDivElement>(null);
  const cellOpts = cell.column.columnDef.meta?.cell;
  const options = useMemo(
    () => cellOpts?.variant === 'select' || cellOpts?.variant === 'status'
      ? cellOpts.options
      : [],
    [cellOpts]
  );
  const optionByValue = useMemo(
    () => new Map(options.map(option => [option.value, option])),
    [options]
  );

  const prevInitialValueRef = useRef(initialValue);

  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(initialValue);
  }

  const onValueChange = useCallback(
    (newValue: string) => {
      if (readOnly) return;
      setValue(newValue);
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: newValue });
      tableMeta?.onCellEditingStop?.();
    },
    [
      tableMeta,
      rowIndex,
      columnId,
      readOnly
    ]
  );

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open && !readOnly) {
        tableMeta?.onCellEditingStart?.(rowIndex, columnId);
      } else {
        tableMeta?.onCellEditingStop?.();
      }
    },
    [
      tableMeta,
      rowIndex,
      columnId,
      readOnly
    ]
  );

  const onWrapperKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (isEditing && event.key === 'Escape') {
        event.preventDefault();
        setValue(initialValue);
        tableMeta?.onCellEditingStop?.();
      } else if (isFocused && event.key === 'Tab') {
        event.preventDefault();
        tableMeta?.onCellEditingStop?.({
          direction: event.shiftKey ? 'left' : 'right'
        });
      }
    },
    [
      isEditing,
      isFocused,
      initialValue,
      tableMeta
    ]
  );

  const currentOption = optionByValue.get(value);
  const displayLabel = currentOption?.label ?? value;

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      isChanged={isChanged}
      readOnly={readOnly}
      onKeyDown={onWrapperKeyDown}>
      {isEditing ? (
        <Select
          value={value}
          onValueChange={onValueChange}
          open={isEditing}
          onOpenChange={onOpenChange}>
          <SelectTrigger
            size="sm"
            className="size-full items-start border-none p-0 shadow-none focus-visible:ring-0 dark:bg-transparent [&_svg]:hidden">
            {displayLabel ? (
              <Badge
                variant="secondary"
                className="gap-1.5 whitespace-pre-wrap px-1.5 py-px">
                <CellOptionIndicator option={currentOption} />
                <SelectValue />
              </Badge>
            ) : (
              <SelectValue />
            )}
          </SelectTrigger>
          <SelectContent
            data-grid-cell-editor=""
            align="start"
            alignOffset={-8}
            sideOffset={-8}
            className="min-w-[calc(var(--radix-select-trigger-width)+16px)]">
            {options.map(option => (
              <SelectItem key={option.value} value={option.value}>
                <span className="flex items-center gap-2">
                  <CellOptionIndicator option={option} />
                  {option.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : displayLabel ? (
        <span data-slot="grid-cell-content">
          <Badge variant="secondary" className="gap-1.5 px-1.5 py-px">
            <CellOptionIndicator option={currentOption} />
            {displayLabel}
          </Badge>
        </span>
      ) : null}
    </DataGridCellWrapper>
  );
}

export function EnumCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly
}: DataGridCellProps<TData>) {
  const initialValue = (cell.getValue() as string) ?? '';
  const [value, setValue] = useState(initialValue);
  const containerRef = useRef<HTMLDivElement>(null);
  const cellOpts = cell.column.columnDef.meta?.cell;

  const enumConfig = useMemo(() => {
    if (cellOpts?.variant !== 'enum') {
      return null;
    }

    return {
      appSlug: cellOpts.appSlug,
      dataSourceSlug: cellOpts.dataSourceSlug,
      fieldSlug: cellOpts.fieldSlug,
      fallbackOptions: cellOpts.options ?? []
    };
  }, [cellOpts]);

  const options = useMemo<Array<CellSelectOption>>(
    () => enumConfig?.fallbackOptions ?? [],
    [enumConfig]
  );

  const optionByValue = useMemo(
    () => new Map(options.map(option => [option.value, option])),
    [options]
  );

  const prevInitialValueRef = useRef(initialValue);

  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(initialValue);
  }

  const onValueChange = useCallback(
    (newValue: string) => {
      if (readOnly) return;
      setValue(newValue);
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: newValue });
      tableMeta?.onCellEditingStop?.();
    },
    [
      tableMeta,
      rowIndex,
      columnId,
      readOnly
    ]
  );

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open && !readOnly) {
        tableMeta?.onCellEditingStart?.(rowIndex, columnId);
      } else {
        tableMeta?.onCellEditingStop?.();
      }
    },
    [
      tableMeta,
      rowIndex,
      columnId,
      readOnly
    ]
  );

  const onWrapperKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (isEditing && event.key === 'Escape') {
        event.preventDefault();
        setValue(initialValue);
        tableMeta?.onCellEditingStop?.();
      } else if (isFocused && event.key === 'Tab') {
        event.preventDefault();
        tableMeta?.onCellEditingStop?.({
          direction: event.shiftKey ? 'left' : 'right'
        });
      }
    },
    [
      isEditing,
      isFocused,
      initialValue,
      tableMeta
    ]
  );

  const currentOption = optionByValue.get(value);
  const displayLabel = currentOption?.label ?? value;

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      isChanged={isChanged}
      readOnly={readOnly}
      onKeyDown={onWrapperKeyDown}>
      {isEditing ? (
        <Select
          value={value}
          onValueChange={onValueChange}
          open={isEditing}
          onOpenChange={onOpenChange}>
          <SelectTrigger
            size="sm"
            className="size-full items-start border-none p-0 shadow-none focus-visible:ring-0 dark:bg-transparent [&_svg]:hidden">
            {displayLabel ? (
              <Badge
                variant="secondary"
                className="gap-1.5 whitespace-pre-wrap px-1.5 py-px">
                <CellOptionIndicator option={currentOption} />
                <SelectValue />
              </Badge>
            ) : (
              <SelectValue />
            )}
          </SelectTrigger>
          <SelectContent
            data-grid-cell-editor=""
            align="start"
            alignOffset={-8}
            sideOffset={-8}
            className="min-w-[calc(var(--radix-select-trigger-width)+16px)]">
            {options.map(option => (
              <SelectItem key={option.value} value={option.value}>
                <span className="flex items-center gap-2">
                  <CellOptionIndicator option={option} />
                  {option.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : displayLabel ? (
        <span data-slot="grid-cell-content">
          <Badge variant="secondary" className="gap-1.5 px-1.5 py-px">
            <CellOptionIndicator option={currentOption} />
            {displayLabel}
          </Badge>
        </span>
      ) : null}
    </DataGridCellWrapper>
  );
}

function CellOptionIndicator({
  option
}: {
  option: CellSelectOption | undefined;
}) {
  if (!option) return null;
  if (option.iconStr) {
    return <DocyrusIcon icon={option.iconStr} className="size-4 shrink-0" />;
  }
  if (option.color) {
    return (
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: option.color }} />
    );
  }

  return null;
}

export function UserCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly
}: DataGridCellProps<TData>) {
  const initialValue = (cell.getValue() as string) ?? '';
  const [value, setValue] = useState(initialValue);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cellOpts = cell.column.columnDef.meta?.cell;
  const options = useMemo<Array<CellUserOption>>(
    () => (cellOpts?.variant === 'user' ? cellOpts.options : []),
    [cellOpts]
  );
  const optionByValue = useMemo(
    () => new Map(options.map(option => [option.value, option])),
    [options]
  );

  const prevInitialValueRef = useRef(initialValue);

  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(initialValue);
  }

  const selectUser = useCallback(
    (nextValue: string) => {
      if (readOnly) return;

      setValue(nextValue);
      tableMeta?.onDataUpdate?.({
        rowIndex,
        columnId,
        value: nextValue
      });
      tableMeta?.onCellEditingStop?.();
    },
    [
      tableMeta,
      rowIndex,
      columnId,
      readOnly
    ]
  );

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open && !readOnly) {
        tableMeta?.onCellEditingStart?.(rowIndex, columnId);
      } else {
        tableMeta?.onCellEditingStop?.();
      }
    },
    [
      tableMeta,
      rowIndex,
      columnId,
      readOnly
    ]
  );

  useEffect(() => {
    if (isEditing) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isEditing]);

  const selectedOption = optionByValue.get(value);

  return (
    <Popover open={isEditing} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>
        <DataGridCellWrapper<TData>
          ref={containerRef}
          cell={cell}
          tableMeta={tableMeta}
          rowIndex={rowIndex}
          columnId={columnId}
          rowHeight={rowHeight}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          isSearchMatch={isSearchMatch}
          isActiveSearchMatch={isActiveSearchMatch}
          isChanged={isChanged}
          readOnly={readOnly}>
          {selectedOption ? (
            <div
              data-slot="grid-cell-content"
              className="size-full overflow-hidden">
              <UserOptionDisplay
                label={selectedOption.label}
                avatarUrl={selectedOption.avatarUrl}
                initials={selectedOption.initials} />
            </div>
          ) : (
            <span
              data-slot="grid-cell-content"
              className="text-muted-foreground">
              Unassigned
            </span>
          )}
        </DataGridCellWrapper>
      </PopoverAnchor>
      <PopoverContent
        data-grid-cell-editor=""
        align="start"
        className="w-[250px] p-0"
        onOpenAutoFocus={e => e.preventDefault()}>
        <Command>
          <CommandInput ref={inputRef} placeholder="Search users..." />
          <CommandList>
            <CommandEmpty>No user found.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="Unassigned" onSelect={() => selectUser('')}>
                <span className="text-muted-foreground">Unassigned</span>
              </CommandItem>
              {options.map(option => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => selectUser(option.value)}>
                  {value === option.value && (
                    <Check className="mr-1 size-3 shrink-0" />
                  )}
                  <UserOptionDisplay
                    label={option.label}
                    avatarUrl={option.avatarUrl}
                    initials={option.initials} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function MultiSelectCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly
}: DataGridCellProps<TData>) {
  const cellValue = useMemo(() => {
    const value = cell.getValue() as Array<string>;

    return value ?? [];
  }, [cell]);

  const cellKey = getCellKey(rowIndex, columnId);
  const prevCellKeyRef = useRef(cellKey);

  const [selectedValues, setSelectedValues]
    = useState<Array<string>>(cellValue);
  const [searchValue, setSearchValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cellOpts = cell.column.columnDef.meta?.cell;
  const options = useMemo(
    () => (cellOpts?.variant === 'multi-select' ? cellOpts.options : []),
    [cellOpts]
  );
  const optionByValue = useMemo(
    () => new Map(options.map(option => [option.value, option])),
    [options]
  );
  const sideOffset = -(containerRef.current?.clientHeight ?? 0);

  const prevCellValueRef = useRef(cellValue);

  if (cellValue !== prevCellValueRef.current) {
    prevCellValueRef.current = cellValue;
    setSelectedValues(cellValue);
  }

  if (prevCellKeyRef.current !== cellKey) {
    prevCellKeyRef.current = cellKey;
    setSearchValue('');
  }

  const onValueChange = useCallback(
    (value: string) => {
      if (readOnly) return;
      let newValues: Array<string> = [];

      setSelectedValues((curr) => {
        newValues = curr.includes(value)
          ? curr.filter(v => v !== value)
          : [...curr, value];

        return newValues;
      });
      queueMicrotask(() => {
        tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: newValues });
        inputRef.current?.focus();
      });
      setSearchValue('');
    },
    [
      tableMeta,
      rowIndex,
      columnId,
      readOnly
    ]
  );

  const removeValue = useCallback(
    (valueToRemove: string, event?: MouseEvent) => {
      if (readOnly) return;
      event?.stopPropagation();
      event?.preventDefault();
      let newValues: Array<string> = [];

      setSelectedValues((curr) => {
        newValues = curr.filter(v => v !== valueToRemove);

        return newValues;
      });
      queueMicrotask(() => {
        tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: newValues });
        inputRef.current?.focus();
      });
    },
    [
      tableMeta,
      rowIndex,
      columnId,
      readOnly
    ]
  );

  const clearAll = useCallback(() => {
    if (readOnly) return;
    setSelectedValues([]);
    tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: [] });
    queueMicrotask(() => inputRef.current?.focus());
  }, [
    tableMeta,
    rowIndex,
    columnId,
    readOnly
  ]);

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open && !readOnly) {
        tableMeta?.onCellEditingStart?.(rowIndex, columnId);
      } else {
        setSearchValue('');
        tableMeta?.onCellEditingStop?.();
      }
    },
    [
      tableMeta,
      rowIndex,
      columnId,
      readOnly
    ]
  );

  const onOpenAutoFocus: NonNullable<
    ComponentProps<typeof PopoverContent>['onOpenAutoFocus']
  > = useCallback((event) => {
    event.preventDefault();
    inputRef.current?.focus();
  }, []);

  const onWrapperKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (isEditing && event.key === 'Escape') {
        event.preventDefault();
        setSelectedValues(cellValue);
        setSearchValue('');
        tableMeta?.onCellEditingStop?.();
      } else if (isFocused && event.key === 'Tab') {
        event.preventDefault();
        setSearchValue('');
        tableMeta?.onCellEditingStop?.({
          direction: event.shiftKey ? 'left' : 'right'
        });
      }
    },
    [
      isEditing,
      isFocused,
      cellValue,
      tableMeta
    ]
  );

  const onInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Backspace' && searchValue === '') {
        event.preventDefault();
        let newValues: Array<string> | null = null;

        setSelectedValues((curr) => {
          if (curr.length === 0) return curr;
          newValues = curr.slice(0, -1);

          return newValues;
        });
        queueMicrotask(() => {
          if (newValues !== null) {
            tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: newValues });
          }
          inputRef.current?.focus();
        });
      }
      if (event.key === 'Escape') {
        event.stopPropagation();
      }
    },
    [
      searchValue,
      tableMeta,
      rowIndex,
      columnId
    ]
  );

  const displayLabels = selectedValues
    .map(val => optionByValue.get(val)?.label ?? val)
    .filter(Boolean);

  const selectedValuesSet = useMemo(
    () => new Set(selectedValues),
    [selectedValues]
  );

  const lineCount = getLineCount(rowHeight);

  const { visibleItems: visibleLabels, hiddenCount: hiddenBadgeCount }
    = useBadgeOverflow({
      items: displayLabels,
      getLabel: label => label,
      containerRef,
      lineCount
    });

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      isChanged={isChanged}
      readOnly={readOnly}
      onKeyDown={onWrapperKeyDown}>
      {isEditing ? (
        <Popover open={isEditing} onOpenChange={onOpenChange}>
          <PopoverAnchor asChild>
            <div className="absolute inset-0" />
          </PopoverAnchor>
          <PopoverContent
            data-grid-cell-editor=""
            align="start"
            sideOffset={sideOffset}
            className="w-[300px] rounded-none p-0"
            onOpenAutoFocus={onOpenAutoFocus}>
            <Command className="**:data-[slot=command-input-wrapper]:h-auto **:data-[slot=command-input-wrapper]:border-none **:data-[slot=command-input-wrapper]:p-0 [&_[data-slot=command-input-wrapper]_svg]:hidden">
              <div className="flex min-h-9 flex-wrap items-center gap-1 border-b px-3 py-1.5">
                {selectedValues.map((value) => {
                  const label = optionByValue.get(value)?.label ?? value;

                  return (
                    <Badge
                      key={value}
                      variant="secondary"
                      className="gap-1 px-1.5 py-px">
                      {label}
                      <button
                        type="button"
                        onClick={event => removeValue(value, event)}
                        onPointerDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}>
                        <X className="size-3" />
                      </button>
                    </Badge>
                  );
                })}
                <CommandInput
                  ref={inputRef}
                  value={searchValue}
                  onValueChange={setSearchValue}
                  onKeyDown={onInputKeyDown}
                  placeholder="Search..."
                  className="h-auto flex-1 p-0" />
              </div>
              <CommandList className="max-h-full">
                <CommandEmpty>No options found.</CommandEmpty>
                <CommandGroup className="max-h-[300px] scroll-py-1 overflow-y-auto overflow-x-hidden">
                  {options.map((option) => {
                    const isSelected = selectedValuesSet.has(option.value);

                    return (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        onSelect={() => onValueChange(option.value)}>
                        <div
                          className={cn(
                            'flex size-4 items-center justify-center rounded-sm border border-primary',
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'opacity-50 [&_svg]:invisible'
                          )}>
                          <Check className="size-3" />
                        </div>
                        <span>{option.label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                {selectedValues.length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={clearAll}
                        className="justify-center text-muted-foreground">
                        Clear all
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      ) : null}
      {displayLabels.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1 overflow-hidden">
          {visibleLabels.map((label, index) => (
            <Badge
              key={selectedValues[index]}
              variant="secondary"
              className="px-1.5 py-px">
              {label}
            </Badge>
          ))}
          {hiddenBadgeCount > 0 && (
            <Badge
              variant="outline"
              className="px-1.5 py-px text-muted-foreground">
              +{hiddenBadgeCount}
            </Badge>
          )}
        </div>
      ) : null}
    </DataGridCellWrapper>
  );
}

export function DateCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly
}: DataGridCellProps<TData>) {
  const initialValue = cell.getValue() as string;
  const [value, setValue] = useState(initialValue ?? '');
  const containerRef = useRef<HTMLDivElement>(null);

  const prevInitialValueRef = useRef(initialValue);

  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(initialValue ?? '');
  }

  const selectedDate = value ? (parseLocalDate(value) ?? undefined) : undefined;

  const onDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date || readOnly) return;

      const formattedDate = formatDateToString(date);

      setValue(formattedDate);
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: formattedDate });
      tableMeta?.onCellEditingStop?.();
    },
    [
      tableMeta,
      rowIndex,
      columnId,
      readOnly
    ]
  );

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open && !readOnly) {
        tableMeta?.onCellEditingStart?.(rowIndex, columnId);
      } else {
        tableMeta?.onCellEditingStop?.();
      }
    },
    [
      tableMeta,
      rowIndex,
      columnId,
      readOnly
    ]
  );

  const onWrapperKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (isEditing && event.key === 'Escape') {
        event.preventDefault();
        setValue(initialValue);
        tableMeta?.onCellEditingStop?.();
      } else if (isFocused && event.key === 'Tab') {
        event.preventDefault();
        tableMeta?.onCellEditingStop?.({
          direction: event.shiftKey ? 'left' : 'right'
        });
      }
    },
    [
      isEditing,
      isFocused,
      initialValue,
      tableMeta
    ]
  );

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      isChanged={isChanged}
      readOnly={readOnly}
      onKeyDown={onWrapperKeyDown}>
      <Popover open={isEditing} onOpenChange={onOpenChange}>
        <PopoverAnchor asChild>
          <span data-slot="grid-cell-content">
            {formatDateForDisplay(value)}
          </span>
        </PopoverAnchor>
        {isEditing && (
          <PopoverContent
            data-grid-cell-editor=""
            align="start"
            alignOffset={-8}
            className="w-auto p-0">
            <Calendar
              autoFocus
              captionLayout="dropdown"
              mode="single"
              defaultMonth={selectedDate ?? new Date()}
              selected={selectedDate}
              onSelect={onDateSelect} />
          </PopoverContent>
        )}
      </Popover>
    </DataGridCellWrapper>
  );
}

export function DateTimeCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly
}: DataGridCellProps<TData>) {
  const cellValue = cell.getValue();
  const initialValue
    = typeof cellValue === 'string'
      ? cellValue
      : cellValue instanceof Date
        ? cellValue.toISOString()
        : '';
  const [value, setValue] = useState(
    toDateTimeLocalInputValue(initialValue)
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevIsEditingRef = useRef(isEditing);

  const prevInitialValueRef = useRef(initialValue);

  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(toDateTimeLocalInputValue(initialValue));
  }

  const commitValue = useCallback(
    (nextLocalValue: string): boolean => {
      if (!nextLocalValue) {
        if (!readOnly) {
          tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: null });
        }

        return true;
      }

      const parsed = new Date(nextLocalValue);

      if (Number.isNaN(parsed.getTime())) {
        toast.error('Invalid date and time');
        setValue(toDateTimeLocalInputValue(initialValue));

        return false;
      }

      const nextValue = parsed.toISOString();

      if (!readOnly && nextValue !== initialValue) {
        tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: nextValue });
      }

      return true;
    },
    [
      columnId,
      initialValue,
      readOnly,
      rowIndex,
      tableMeta
    ]
  );

  const onBlur = useCallback(() => {
    commitValue(value);
    tableMeta?.onCellEditingStop?.();
  }, [commitValue, tableMeta, value]);

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value);
    },
    []
  );

  const onWrapperKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (isEditing) {
        if (event.key === 'Enter') {
          event.preventDefault();
          if (commitValue(value)) {
            tableMeta?.onCellEditingStop?.({ moveToNextRow: true });
          }

          return;
        }

        if (event.key === 'Tab') {
          event.preventDefault();
          if (commitValue(value)) {
            tableMeta?.onCellEditingStop?.({
              direction: event.shiftKey ? 'left' : 'right'
            });
          }

          return;
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          setValue(toDateTimeLocalInputValue(initialValue));
          inputRef.current?.blur();
        }
      }
    },
    [
      commitValue,
      initialValue,
      isEditing,
      tableMeta,
      value
    ]
  );

  useEffect(() => {
    const wasEditing = prevIsEditingRef.current;

    prevIsEditingRef.current = isEditing;

    if (isEditing && !wasEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const displayValue = formatDateTimeForDisplay(value);

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      isChanged={isChanged}
      readOnly={readOnly}
      onKeyDown={onWrapperKeyDown}>
      {isEditing ? (
        <input
          ref={inputRef}
          type="datetime-local"
          value={value}
          className="w-full border-none bg-transparent p-0 outline-none"
          onBlur={onBlur}
          onChange={onChange} />
      ) : (
        <span data-slot="grid-cell-content">{displayValue}</span>
      )}
    </DataGridCellWrapper>
  );
}

export function FileCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly
}: DataGridCellProps<TData>) {
  const cellValue = useMemo(
    () => (cell.getValue() as Array<FileCellData>) ?? [],
    [cell]
  );

  const cellKey = getCellKey(rowIndex, columnId);
  const prevCellKeyRef = useRef(cellKey);

  const labelId = useId();
  const descriptionId = useId();

  const [files, setFiles] = useState<Array<FileCellData>>(cellValue);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(
    new Set()
  );
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(
    new Set()
  );
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUploading = uploadingFiles.size > 0;
  const isDeleting = deletingFiles.size > 0;
  const isPending = isUploading || isDeleting;
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const cellOpts = cell.column.columnDef.meta?.cell;
  const sideOffset = -(containerRef.current?.clientHeight ?? 0);

  const fileCellOpts = cellOpts?.variant === 'file' ? cellOpts : null;
  const maxFileSize = fileCellOpts?.maxFileSize ?? 10 * 1024 * 1024;
  const maxFiles = fileCellOpts?.maxFiles ?? 10;
  const accept = fileCellOpts?.accept;
  const multiple = fileCellOpts?.multiple ?? false;

  const acceptedTypes = useMemo(
    () => (accept ? accept.split(',').map(t => t.trim()) : null),
    [accept]
  );

  const prevCellValueRef = useRef(cellValue);

  if (cellValue !== prevCellValueRef.current) {
    prevCellValueRef.current = cellValue;
    for (const file of files) {
      if (file.url) {
        URL.revokeObjectURL(file.url);
      }
    }
    setFiles(cellValue);
    setError(null);
  }

  if (prevCellKeyRef.current !== cellKey) {
    prevCellKeyRef.current = cellKey;
    setError(null);
  }

  const validateFile = useCallback(
    (file: File): string | null => {
      if (maxFileSize && file.size > maxFileSize) {
        return `File size exceeds ${formatFileSize(maxFileSize)}`;
      }
      if (acceptedTypes) {
        const fileExtension = `.${file.name.split('.').pop()}`;
        const isAccepted = acceptedTypes.some((type) => {
          if (type.endsWith('/*')) {
            const baseType = type.slice(0, -2);

            return file.type.startsWith(`${baseType}/`);
          }
          if (type.startsWith('.')) {
            return fileExtension.toLowerCase() === type.toLowerCase();
          }

          return file.type === type;
        });

        if (!isAccepted) {
          return 'File type not accepted';
        }
      }

      return null;
    },
    [maxFileSize, acceptedTypes]
  );

  const addFiles = useCallback(
    async (newFiles: Array<File>, skipUpload = false) => {
      if (readOnly || isPending) return;
      setError(null);

      if (maxFiles && files.length + newFiles.length > maxFiles) {
        const errorMessage = `Maximum ${maxFiles} files allowed`;

        setError(errorMessage);
        toast(errorMessage);
        setTimeout(() => {
          setError(null);
        }, 2000);

        return;
      }

      const rejectedFiles: Array<{ name: string; reason: string }> = [];
      const filesToValidate: Array<File> = [];

      for (const file of newFiles) {
        const validationError = validateFile(file);

        if (validationError) {
          rejectedFiles.push({ name: file.name, reason: validationError });
          continue;
        }
        filesToValidate.push(file);
      }

      if (rejectedFiles.length > 0) {
        const firstError = rejectedFiles[0];

        if (firstError) {
          setError(firstError.reason);

          const truncatedName
            = firstError.name.length > 20
              ? `${firstError.name.slice(0, 20)}...`
              : firstError.name;

          if (rejectedFiles.length === 1) {
            toast(firstError.reason, {
              description: `"${truncatedName}" has been rejected`
            });
          } else {
            toast(firstError.reason, {
              description: `"${truncatedName}" and ${rejectedFiles.length - 1} more rejected`
            });
          }

          setTimeout(() => {
            setError(null);
          }, 2000);
        }
      }

      if (filesToValidate.length > 0) {
        if (!skipUpload) {
          const tempFiles = filesToValidate.map(f => ({
            id: crypto.randomUUID(),
            name: f.name,
            size: f.size,
            type: f.type,
            url: undefined
          }));
          const filesWithTemp = [...files, ...tempFiles];

          setFiles(filesWithTemp);

          const uploadingIds: Set<string> = new Set(tempFiles.map(f => f.id));

          setUploadingFiles(uploadingIds);

          let uploadedFiles: Array<FileCellData> = [];

          if (tableMeta?.onFilesUpload) {
            try {
              uploadedFiles = await tableMeta.onFilesUpload({
                files: filesToValidate,
                rowIndex,
                columnId
              });
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : `Failed to upload ${filesToValidate.length} file${filesToValidate.length !== 1 ? 's' : ''}`
              );
              setFiles(prev => prev.filter(f => !uploadingIds.has(f.id)));
              setUploadingFiles(new Set());

              return;
            }
          } else {
            uploadedFiles = filesToValidate.map((f, i) => ({
              id: tempFiles[i]?.id ?? crypto.randomUUID(),
              name: f.name,
              size: f.size,
              type: f.type,
              url: URL.createObjectURL(f)
            }));
          }

          const finalFiles = filesWithTemp
            .map((f) => {
              if (uploadingIds.has(f.id)) {
                return uploadedFiles.find(uf => uf.name === f.name) ?? f;
              }

              return f;
            })
            .filter(f => f.url !== undefined);

          setFiles(finalFiles);
          setUploadingFiles(new Set());
          tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: finalFiles });
        } else {
          const newFilesData: Array<FileCellData> = filesToValidate.map(
            f => ({
              id: crypto.randomUUID(),
              name: f.name,
              size: f.size,
              type: f.type,
              url: URL.createObjectURL(f)
            })
          );
          const updatedFiles = [...files, ...newFilesData];

          setFiles(updatedFiles);
          tableMeta?.onDataUpdate?.({
            rowIndex,
            columnId,
            value: updatedFiles
          });
        }
      }
    },
    [
      files,
      maxFiles,
      validateFile,
      tableMeta,
      rowIndex,
      columnId,
      readOnly,
      isPending
    ]
  );

  const removeFile = useCallback(
    async (fileId: string) => {
      if (readOnly || isPending) return;
      setError(null);

      const fileToRemove = files.find(f => f.id === fileId);

      if (!fileToRemove) return;

      setDeletingFiles(prev => new Set(prev).add(fileId));

      if (tableMeta?.onFilesDelete) {
        try {
          await tableMeta.onFilesDelete({
            fileIds: [fileId],
            rowIndex,
            columnId
          });
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : `Failed to delete ${fileToRemove.name}`
          );
          setDeletingFiles((prev) => {
            const next = new Set(prev);

            next.delete(fileId);

            return next;
          });

          return;
        }
      }

      if (fileToRemove.url?.startsWith('blob:')) {
        URL.revokeObjectURL(fileToRemove.url);
      }

      const updatedFiles = files.filter(f => f.id !== fileId);

      setFiles(updatedFiles);
      setDeletingFiles((prev) => {
        const next = new Set(prev);

        next.delete(fileId);

        return next;
      });
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: updatedFiles });
    },
    [
      files,
      tableMeta,
      rowIndex,
      columnId,
      readOnly,
      isPending
    ]
  );

  const clearAll = useCallback(async () => {
    if (readOnly || isPending) return;
    setError(null);

    const fileIds = files.map(f => f.id);

    setDeletingFiles(new Set(fileIds));

    if (tableMeta?.onFilesDelete && files.length > 0) {
      try {
        await tableMeta.onFilesDelete({
          fileIds,
          rowIndex,
          columnId
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete files'
        );
        setDeletingFiles(new Set());

        return;
      }
    }

    for (const file of files) {
      if (file.url?.startsWith('blob:')) {
        URL.revokeObjectURL(file.url);
      }
    }
    setFiles([]);
    setDeletingFiles(new Set());
    tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: [] });
  }, [
    files,
    tableMeta,
    rowIndex,
    columnId,
    readOnly,
    isPending
  ]);

  const onCellDragEnter = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.types.includes('Files')) {
      setIsDraggingOver(true);
    }
  }, []);

  const onCellDragLeave = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    if (
      x <= rect.left
      || x >= rect.right
      || y <= rect.top
      || y >= rect.bottom
    ) {
      setIsDraggingOver(false);
    }
  }, []);

  const onCellDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const onCellDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDraggingOver(false);

      const droppedFiles = Array.from(event.dataTransfer.files);

      if (droppedFiles.length > 0) {
        addFiles(droppedFiles, false);
      }
    },
    [addFiles]
  );

  const onDropzoneDragEnter = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDropzoneDragLeave = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    if (
      x <= rect.left
      || x >= rect.right
      || y <= rect.top
      || y >= rect.bottom
    ) {
      setIsDragging(false);
    }
  }, []);

  const onDropzoneDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const onDropzoneDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);

      const droppedFiles = Array.from(event.dataTransfer.files);

      addFiles(droppedFiles, false);
    },
    [addFiles]
  );

  const onDropzoneClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onDropzoneKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onDropzoneClick();
      }
    },
    [onDropzoneClick]
  );

  const onFileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files ?? []);

      addFiles(selectedFiles, false);
      event.target.value = '';
    },
    [addFiles]
  );

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open && !readOnly) {
        setError(null);
        tableMeta?.onCellEditingStart?.(rowIndex, columnId);
      } else {
        setError(null);
        tableMeta?.onCellEditingStop?.();
      }
    },
    [
      tableMeta,
      rowIndex,
      columnId,
      readOnly
    ]
  );

  const onEscapeKeyDown: NonNullable<
    ComponentProps<typeof PopoverContent>['onEscapeKeyDown']
  > = useCallback((event) => {
    /*
     * Prevent the escape key from propagating to the data grid's keyboard handler
     * which would call blurCell() and remove focus from the cell
     */
    event.stopPropagation();
  }, []);

  const onOpenAutoFocus: NonNullable<
    ComponentProps<typeof PopoverContent>['onOpenAutoFocus']
  > = useCallback((event) => {
    event.preventDefault();
    queueMicrotask(() => {
      dropzoneRef.current?.focus();
    });
  }, []);

  const onWrapperKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (isEditing) {
        if (event.key === 'Escape') {
          event.preventDefault();
          setFiles(cellValue);
          setError(null);
          tableMeta?.onCellEditingStop?.();
        } else if (event.key === ' ') {
          event.preventDefault();
          onDropzoneClick();
        } else if (event.key === 'Tab') {
          event.preventDefault();
          tableMeta?.onCellEditingStop?.({
            direction: event.shiftKey ? 'left' : 'right'
          });
        }
      } else if (isFocused && event.key === 'Enter') {
        event.preventDefault();
        tableMeta?.onCellEditingStart?.(rowIndex, columnId);
      } else if (isFocused && event.key === 'Tab') {
        event.preventDefault();
        tableMeta?.onCellEditingStop?.({
          direction: event.shiftKey ? 'left' : 'right'
        });
      }
    },
    [
      isEditing,
      isFocused,
      cellValue,
      tableMeta,
      onDropzoneClick,
      rowIndex,
      columnId
    ]
  );

  useEffect(() => {
    return () => {
      for (const file of files) {
        if (file.url) {
          URL.revokeObjectURL(file.url);
        }
      }
    };
  }, [files]);

  const lineCount = getLineCount(rowHeight);

  const { visibleItems: visibleFiles, hiddenCount: hiddenFileCount }
    = useBadgeOverflow({
      items: files,
      getLabel: file => file.name,
      containerRef,
      lineCount,
      cacheKeyPrefix: 'file',
      iconSize: 12,
      maxWidth: 100
    });

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      isChanged={isChanged}
      readOnly={readOnly}
      className={cn({
        'ring-1 ring-primary/80 ring-inset': isDraggingOver
      })}
      onDragEnter={onCellDragEnter}
      onDragLeave={onCellDragLeave}
      onDragOver={onCellDragOver}
      onDrop={onCellDrop}
      onKeyDown={onWrapperKeyDown}>
      {isEditing ? (
        <Popover open={isEditing} onOpenChange={onOpenChange}>
          <PopoverAnchor asChild>
            <div className="absolute inset-0" />
          </PopoverAnchor>
          <PopoverContent
            data-grid-cell-editor=""
            align="start"
            sideOffset={sideOffset}
            className="w-[400px] rounded-none p-0"
            onEscapeKeyDown={onEscapeKeyDown}
            onOpenAutoFocus={onOpenAutoFocus}>
            <div className="flex flex-col gap-2 p-3">
              <span id={labelId} className="sr-only">
                File upload
              </span>
              <div
                role="region"
                aria-labelledby={labelId}
                aria-describedby={descriptionId}
                aria-invalid={!!error}
                aria-disabled={isPending}
                data-dragging={isDragging ? '' : undefined}
                data-invalid={error ? '' : undefined}
                data-disabled={isPending ? '' : undefined}
                tabIndex={isDragging || isPending ? -1 : 0}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 outline-none transition-colors hover:bg-accent/30 focus-visible:border-ring/50 data-disabled:pointer-events-none data-dragging:border-primary/30 data-invalid:border-destructive data-dragging:bg-accent/30 data-disabled:opacity-50 data-invalid:ring-destructive/20"
                ref={dropzoneRef}
                onClick={onDropzoneClick}
                onDragEnter={onDropzoneDragEnter}
                onDragLeave={onDropzoneDragLeave}
                onDragOver={onDropzoneDragOver}
                onDrop={onDropzoneDrop}
                onKeyDown={onDropzoneKeyDown}>
                <Upload className="size-8 text-muted-foreground" />
                <div className="text-center text-sm">
                  <p className="font-medium">
                    {isDragging ? 'Drop files here' : 'Drag files here'}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    or click to browse
                  </p>
                </div>
                <p id={descriptionId} className="text-muted-foreground text-xs">
                  {maxFileSize
                    ? `Max size: ${formatFileSize(maxFileSize)}${maxFiles ? ` • Max ${maxFiles} files` : ''}`
                    : maxFiles
                      ? `Max ${maxFiles} files`
                      : 'Select files to upload'}
                </p>
              </div>
              <input
                type="file"
                aria-labelledby={labelId}
                aria-describedby={descriptionId}
                multiple={multiple}
                accept={accept}
                className="sr-only"
                ref={fileInputRef}
                onChange={onFileInputChange} />
              {files.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-muted-foreground text-xs">
                      {files.length} {files.length === 1 ? 'file' : 'files'}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-muted-foreground text-xs"
                      onClick={clearAll}
                      disabled={isPending}>
                      Clear all
                    </Button>
                  </div>
                  <div className="max-h-[200px] space-y-1 overflow-y-auto">
                    {files.map((file) => {
                      const FileIcon = getFileIcon(file.type);
                      const isFileUploading = uploadingFiles.has(file.id);
                      const isFileDeleting = deletingFiles.has(file.id);
                      const isFilePending = isFileUploading || isFileDeleting;

                      return (
                        <div
                          key={file.id}
                          data-pending={isFilePending ? '' : undefined}
                          className="flex items-center gap-2 rounded-md border bg-muted/50 px-2 py-1.5 data-pending:opacity-60">
                          {FileIcon && (
                            <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                          )}
                          <div className="flex-1 overflow-hidden">
                            <p className="truncate text-sm">{file.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {isFileUploading
                                ? 'Uploading...'
                                : isFileDeleting
                                  ? 'Deleting...'
                                  : formatFileSize(file.size)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-5 rounded-sm"
                            onClick={() => removeFile(file.id)}
                            disabled={isPending}>
                            <X className="size-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      ) : null}
      {isDraggingOver ? (
        <div className="flex items-center justify-center gap-2 text-primary text-sm">
          <Upload className="size-4" />
          <span>Drop files here</span>
        </div>
      ) : files.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1 overflow-hidden">
          {visibleFiles.map((file) => {
            const isUploading = uploadingFiles.has(file.id);

            if (isUploading) {
              return (
                <Skeleton
                  key={file.id}
                  className="h-5 shrink-0 px-1.5"
                  style={{
                    width: `${Math.min(file.name.length * 8 + 30, 100)}px`
                  }} />
              );
            }

            const FileIcon = getFileIcon(file.type);

            return (
              <Badge
                key={file.id}
                variant="secondary"
                className="gap-1 px-1.5 py-px">
                {FileIcon && <FileIcon className="size-3 shrink-0" />}
                <span className="max-w-[100px] truncate">{file.name}</span>
              </Badge>
            );
          })}
          {hiddenFileCount > 0 && (
            <Badge
              variant="outline"
              className="px-1.5 py-px text-muted-foreground">
              +{hiddenFileCount}
            </Badge>
          )}
        </div>
      ) : null}
    </DataGridCellWrapper>
  );
}

export function SwitchCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly
}: Omit<DataGridCellProps<TData>, 'isEditing'>) {
  const initialValue = cell.getValue() as boolean;
  const [value, setValue] = useState(Boolean(initialValue));
  const containerRef = useRef<HTMLDivElement>(null);

  const prevInitialValueRef = useRef(initialValue);

  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(Boolean(initialValue));
  }

  const onCheckedChange = useCallback(
    (checked: boolean) => {
      if (readOnly) return;
      setValue(checked);
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: checked });
    },
    [
      tableMeta,
      rowIndex,
      columnId,
      readOnly
    ]
  );

  const onWrapperKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (
        isFocused
        && !readOnly
        && (event.key === ' ' || event.key === 'Enter')
      ) {
        event.preventDefault();
        event.stopPropagation();
        onCheckedChange(!value);
      } else if (isFocused && event.key === 'Tab') {
        event.preventDefault();
        tableMeta?.onCellEditingStop?.({
          direction: event.shiftKey ? 'left' : 'right'
        });
      }
    },
    [
      isFocused,
      value,
      onCheckedChange,
      tableMeta,
      readOnly
    ]
  );

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={false}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      isChanged={isChanged}
      readOnly={readOnly}
      className="flex size-full justify-center"
      onKeyDown={onWrapperKeyDown}>
      <Switch
        checked={value}
        onCheckedChange={onCheckedChange}
        disabled={readOnly}
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()} />
    </DataGridCellWrapper>
  );
}

export function RatingCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly
}: Omit<DataGridCellProps<TData>, 'isEditing'>) {
  const initialValue = cell.getValue() as number;
  const [value, setValue] = useState(initialValue ?? 0);
  const containerRef = useRef<HTMLDivElement>(null);

  const cellOpts = cell.column.columnDef.meta?.cell;
  const maxRating = cellOpts?.variant === 'rating' ? (cellOpts.max ?? 5) : 5;

  const prevInitialValueRef = useRef(initialValue);

  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(initialValue ?? 0);
  }

  const onStarClick = useCallback(
    (rating: number) => {
      if (readOnly) return;
      const newValue = rating === value ? 0 : rating;

      setValue(newValue);
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: newValue });
    },
    [
      tableMeta,
      rowIndex,
      columnId,
      readOnly,
      value
    ]
  );

  const onWrapperKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (isFocused && !readOnly) {
        const numKey = Number(event.key);

        if (numKey >= 0 && numKey <= maxRating) {
          event.preventDefault();
          setValue(numKey);
          tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: numKey });
        }
      }
      if (isFocused && event.key === 'Tab') {
        event.preventDefault();
        tableMeta?.onCellEditingStop?.({
          direction: event.shiftKey ? 'left' : 'right'
        });
      }
    },
    [
      isFocused,
      readOnly,
      maxRating,
      tableMeta,
      rowIndex,
      columnId
    ]
  );

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={false}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      isChanged={isChanged}
      readOnly={readOnly}
      onKeyDown={onWrapperKeyDown}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }, (_, i) => (
          <button
            key={i}
            type="button"
            tabIndex={-1}
            disabled={readOnly}
            onClick={(e) => {
              e.stopPropagation();
              onStarClick(i + 1);
            }}
            onMouseDown={e => e.stopPropagation()}
            className="disabled:cursor-default">
            <Star
              className={cn(
                'size-4',
                i < value
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground/40'
              )} />
          </button>
        ))}
      </div>
    </DataGridCellWrapper>
  );
}

export function DurationCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isEditing,
  isFocused,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly
}: DataGridCellProps<TData>) {
  const initialValue = cell.getValue() as number;
  const [value, setValue] = useState(formatDuration(initialValue) || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const prevInitialValueRef = useRef(initialValue);

  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(formatDuration(initialValue) || '');
  }

  const onBlur = useCallback(() => {
    const seconds = parseDuration(value);

    if (!readOnly && seconds !== initialValue) {
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: seconds });
    }
    tableMeta?.onCellEditingStop?.();
  }, [
    tableMeta,
    rowIndex,
    columnId,
    initialValue,
    value,
    readOnly
  ]);

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value);
    },
    []
  );

  const onWrapperKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (isEditing) {
        if (event.key === 'Enter') {
          event.preventDefault();
          const seconds = parseDuration(value);

          if (seconds !== initialValue) {
            tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: seconds });
          }
          tableMeta?.onCellEditingStop?.({ moveToNextRow: true });
        } else if (event.key === 'Tab') {
          event.preventDefault();
          const seconds = parseDuration(value);

          if (seconds !== initialValue) {
            tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: seconds });
          }
          tableMeta?.onCellEditingStop?.({
            direction: event.shiftKey ? 'left' : 'right'
          });
        } else if (event.key === 'Escape') {
          event.preventDefault();
          setValue(formatDuration(initialValue) || '');
          inputRef.current?.blur();
        }
      }
    },
    [
      isEditing,
      initialValue,
      tableMeta,
      rowIndex,
      columnId,
      value
    ]
  );

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      isChanged={isChanged}
      readOnly={readOnly}
      onKeyDown={onWrapperKeyDown}>
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder="HH:MM:SS"
          className="w-full border-none bg-transparent p-0 font-mono outline-none"
          onBlur={onBlur}
          onChange={onChange} />
      ) : (
        <span data-slot="grid-cell-content" className="font-mono">
          {value || ''}
        </span>
      )}
    </DataGridCellWrapper>
  );
}

export function TimeCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isEditing,
  isFocused,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly
}: DataGridCellProps<TData>) {
  const initialValue = cell.getValue() as string;
  const [value, setValue] = useState(initialValue ?? '');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const prevInitialValueRef = useRef(initialValue);

  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(initialValue ?? '');
  }

  const onBlur = useCallback(() => {
    if (!readOnly && value !== initialValue) {
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: value || null });
    }
    tableMeta?.onCellEditingStop?.();
  }, [
    tableMeta,
    rowIndex,
    columnId,
    initialValue,
    value,
    readOnly
  ]);

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value);
    },
    []
  );

  const onWrapperKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (isEditing) {
        if (event.key === 'Enter') {
          event.preventDefault();
          if (value !== initialValue) {
            tableMeta?.onDataUpdate?.({
              rowIndex,
              columnId,
              value: value || null
            });
          }
          tableMeta?.onCellEditingStop?.({ moveToNextRow: true });
        } else if (event.key === 'Tab') {
          event.preventDefault();
          if (value !== initialValue) {
            tableMeta?.onDataUpdate?.({
              rowIndex,
              columnId,
              value: value || null
            });
          }
          tableMeta?.onCellEditingStop?.({
            direction: event.shiftKey ? 'left' : 'right'
          });
        } else if (event.key === 'Escape') {
          event.preventDefault();
          setValue(initialValue ?? '');
          inputRef.current?.blur();
        }
      }
    },
    [
      isEditing,
      initialValue,
      tableMeta,
      rowIndex,
      columnId,
      value
    ]
  );

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const displayValue = useMemo(() => {
    if (!value) return '';
    try {
      const [h, m] = value.split(':');
      const d = new Date();

      d.setHours(Number(h), Number(m), 0);

      return d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return value;
    }
  }, [value]);

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      isChanged={isChanged}
      readOnly={readOnly}
      onKeyDown={onWrapperKeyDown}>
      {isEditing ? (
        <input
          ref={inputRef}
          type="time"
          value={value}
          className="w-full border-none bg-transparent p-0 outline-none"
          onBlur={onBlur}
          onChange={onChange} />
      ) : (
        <span
          data-slot="grid-cell-content"
          className="flex items-center gap-1"
          style={{ WebkitLineClamp: 'unset', WebkitBoxOrient: 'initial', overflow: 'visible' }}>
          {displayValue ? (
            <>
              <Clock className="size-3.5 text-muted-foreground" />
              {displayValue}
            </>
          ) : null}
        </span>
      )}
    </DataGridCellWrapper>
  );
}

export function DateRangeCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isEditing,
  isFocused,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly
}: DataGridCellProps<TData>) {
  const initialValue = cell.getValue() as string;
  const containerRef = useRef<HTMLDivElement>(null);
  const parsed = useMemo(
    () => parseDateRange(initialValue),
    [initialValue]
  );
  const [dateRange, setDateRange] = useState<
    { from: Date; to?: Date } | undefined
  >(parsed ? { from: parsed.start, to: parsed.end } : undefined);

  const prevInitialValueRef = useRef(initialValue);

  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    const newParsed = parseDateRange(initialValue);

    setDateRange(
      newParsed ? { from: newParsed.start, to: newParsed.end } : undefined
    );
  }

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open && !readOnly) {
        tableMeta?.onCellEditingStart?.(rowIndex, columnId);
      } else {
        if (dateRange?.from && dateRange?.to && !readOnly) {
          const rangeStr = `[${dateRange.from.toISOString()}, ${dateRange.to.toISOString()}]`;

          if (rangeStr !== initialValue) {
            tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: rangeStr });
          }
        }
        tableMeta?.onCellEditingStop?.();
      }
    },
    [
      tableMeta,
      rowIndex,
      columnId,
      readOnly,
      dateRange,
      initialValue
    ]
  );

  const displayText = useMemo(() => {
    if (!dateRange?.from) return '';
    if (!dateRange.to) return formatDateForDisplay(dateRange.from.toISOString());

    return formatDateRange(dateRange.from, dateRange.to);
  }, [dateRange]);

  return (
    <Popover open={isEditing} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>
        <DataGridCellWrapper<TData>
          ref={containerRef}
          cell={cell}
          tableMeta={tableMeta}
          rowIndex={rowIndex}
          columnId={columnId}
          rowHeight={rowHeight}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          isSearchMatch={isSearchMatch}
          isActiveSearchMatch={isActiveSearchMatch}
          isChanged={isChanged}
          readOnly={readOnly}>
          <span data-slot="grid-cell-content">{displayText}</span>
        </DataGridCellWrapper>
      </PopoverAnchor>
      <PopoverContent
        data-grid-cell-editor=""
        align="start"
        className="w-auto p-0"
        onOpenAutoFocus={e => e.preventDefault()}>
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={(range) => {
            if (range?.from) setDateRange(range as { from: Date; to?: Date });
          }}
          numberOfMonths={2} />
      </PopoverContent>
    </Popover>
  );
}

export function ColorCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isEditing,
  isFocused,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly
}: DataGridCellProps<TData>) {
  const initialValue = cell.getValue() as string;
  const [value, setValue] = useState(initialValue ?? '');
  const containerRef = useRef<HTMLDivElement>(null);

  const prevInitialValueRef = useRef(initialValue);

  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(initialValue ?? '');
  }

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open && !readOnly) {
        tableMeta?.onCellEditingStart?.(rowIndex, columnId);
      } else {
        if (!readOnly && value !== initialValue) {
          tableMeta?.onDataUpdate?.({
            rowIndex,
            columnId,
            value: value || null
          });
        }
        tableMeta?.onCellEditingStop?.();
      }
    },
    [
      tableMeta,
      rowIndex,
      columnId,
      readOnly,
      value,
      initialValue
    ]
  );

  return (
    <Popover open={isEditing} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>
        <DataGridCellWrapper<TData>
          ref={containerRef}
          cell={cell}
          tableMeta={tableMeta}
          rowIndex={rowIndex}
          columnId={columnId}
          rowHeight={rowHeight}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          isSearchMatch={isSearchMatch}
          isActiveSearchMatch={isActiveSearchMatch}
          isChanged={isChanged}
          readOnly={readOnly}>
          <div
            data-slot="grid-cell-content"
            className="flex items-center gap-1.5"
            style={{ WebkitLineClamp: 'unset', WebkitBoxOrient: 'initial', overflow: 'visible' }}>
            {value ? (
              <>
                <div
                  className="size-4 shrink-0 rounded-sm border"
                  style={{ backgroundColor: value }} />
                <span className="truncate font-mono text-xs">{value}</span>
              </>
            ) : null}
          </div>
        </DataGridCellWrapper>
      </PopoverAnchor>
      <PopoverContent
        data-grid-cell-editor=""
        align="start"
        className="w-[220px] p-3"
        onOpenAutoFocus={e => e.preventDefault()}>
        <div className="flex flex-col gap-2">
          <input
            type="color"
            value={value || '#000000'}
            className="h-8 w-full cursor-pointer rounded border-0"
            onChange={e => setValue(e.target.value)} />
          <input
            type="text"
            value={value}
            placeholder="#000000"
            className="w-full rounded border px-2 py-1 font-mono text-xs"
            onChange={e => setValue(e.target.value)} />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function IconCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly
}: Omit<DataGridCellProps<TData>, 'isEditing'>) {
  const value = cell.getValue() as string;
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={false}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      isChanged={isChanged}
      readOnly={readOnly}>
      <span data-slot="grid-cell-content" className="truncate text-sm">
        {value || ''}
      </span>
    </DataGridCellWrapper>
  );
}

export function CurrencyCodeCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isEditing,
  isFocused,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly
}: DataGridCellProps<TData>) {
  const initialValue = cell.getValue() as string;
  const containerRef = useRef<HTMLDivElement>(null);

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open && !readOnly) {
        tableMeta?.onCellEditingStart?.(rowIndex, columnId);
      } else {
        tableMeta?.onCellEditingStop?.();
      }
    },
    [
      tableMeta,
      rowIndex,
      columnId,
      readOnly
    ]
  );

  const onValueChange = useCallback(
    (newValue: string) => {
      if (!readOnly && newValue !== initialValue) {
        tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: newValue });
      }
      tableMeta?.onCellEditingStop?.();
    },
    [
      tableMeta,
      rowIndex,
      columnId,
      readOnly,
      initialValue
    ]
  );

  const displayText = initialValue
    ? `${initialValue} (${getCurrencySymbol(initialValue)})`
    : '';

  return (
    <Popover open={isEditing} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>
        <DataGridCellWrapper<TData>
          ref={containerRef}
          cell={cell}
          tableMeta={tableMeta}
          rowIndex={rowIndex}
          columnId={columnId}
          rowHeight={rowHeight}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          isSearchMatch={isSearchMatch}
          isActiveSearchMatch={isActiveSearchMatch}
          isChanged={isChanged}
          readOnly={readOnly}>
          <span data-slot="grid-cell-content">{displayText}</span>
        </DataGridCellWrapper>
      </PopoverAnchor>
      <PopoverContent
        data-grid-cell-editor=""
        align="start"
        className="w-[200px] p-0"
        onOpenAutoFocus={e => e.preventDefault()}>
        <Command>
          <CommandInput placeholder="Search currency..." />
          <CommandList>
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup>
              {COMMON_CURRENCIES.map(c => (
                <CommandItem
                  key={c.code}
                  value={c.code}
                  onSelect={onValueChange}>
                  <span className="font-mono">{c.code}</span>
                  <span className="ml-1 text-muted-foreground">{c.name}</span>
                  {c.code === initialValue && (
                    <Check className="ml-auto size-4" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function ImageCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly
}: Omit<DataGridCellProps<TData>, 'isEditing'>) {
  const value = cell.getValue() as {
    file_name?: string;
    signed_url?: string;
  } | null;
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={false}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      isChanged={isChanged}
      readOnly={readOnly}>
      {value?.signed_url ? (
        <div
          data-slot="grid-cell-content"
          className="flex items-center gap-1"
          style={{ WebkitLineClamp: 'unset', WebkitBoxOrient: 'initial', overflow: 'visible' }}>
          <img
            src={value.signed_url}
            alt={value.file_name ?? 'Image'}
            className="size-6 rounded object-cover" />
          <span className="truncate text-xs">{value.file_name}</span>
        </div>
      ) : (
        <span data-slot="grid-cell-content" />
      )}
    </DataGridCellWrapper>
  );
}

export function RelationCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isEditing,
  isFocused,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly
}: DataGridCellProps<TData>) {
  const initialValue = cell.getValue() as string | { id: string; name: string };
  const containerRef = useRef<HTMLDivElement>(null);

  const displayName
    = typeof initialValue === 'object' && initialValue !== null
      ? initialValue.name
      : typeof initialValue === 'string'
        ? initialValue
        : '';

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open && !readOnly) {
        tableMeta?.onCellEditingStart?.(rowIndex, columnId);
      } else {
        tableMeta?.onCellEditingStop?.();
      }
    },
    [
      tableMeta,
      rowIndex,
      columnId,
      readOnly
    ]
  );

  return (
    <Popover open={isEditing} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>
        <DataGridCellWrapper<TData>
          ref={containerRef}
          cell={cell}
          tableMeta={tableMeta}
          rowIndex={rowIndex}
          columnId={columnId}
          rowHeight={rowHeight}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          isSearchMatch={isSearchMatch}
          isActiveSearchMatch={isActiveSearchMatch}
          isChanged={isChanged}
          readOnly={readOnly}>
          <span data-slot="grid-cell-content" className="truncate text-primary">
            {displayName}
          </span>
        </DataGridCellWrapper>
      </PopoverAnchor>
      <PopoverContent
        data-grid-cell-editor=""
        align="start"
        className="w-[250px] p-2"
        onOpenAutoFocus={e => e.preventDefault()}>
        <p className="text-xs text-muted-foreground">
          Relation editing requires external data source lookup.
        </p>
      </PopoverContent>
    </Popover>
  );
}

export function UserMultiSelectCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isEditing,
  isFocused,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly
}: DataGridCellProps<TData>) {
  const initialValue = (cell.getValue() ?? []) as Array<string>;
  const [selectedValues, setSelectedValues] = useState<Array<string>>(
    Array.isArray(initialValue) ? initialValue : []
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const cellOpts = cell.column.columnDef.meta?.cell;
  const options: Array<CellUserOption>
    = cellOpts?.variant === 'user-multi-select' ? cellOpts.options : [];

  const prevInitialValueRef = useRef(initialValue);

  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setSelectedValues(Array.isArray(initialValue) ? initialValue : []);
  }

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open && !readOnly) {
        tableMeta?.onCellEditingStart?.(rowIndex, columnId);
      } else {
        if (!readOnly) {
          tableMeta?.onDataUpdate?.({
            rowIndex,
            columnId,
            value: selectedValues
          });
        }
        tableMeta?.onCellEditingStop?.();
      }
    },
    [
      tableMeta,
      rowIndex,
      columnId,
      readOnly,
      selectedValues
    ]
  );

  const toggleOption = useCallback((optValue: string) => {
    setSelectedValues(prev => prev.includes(optValue)
      ? prev.filter(v => v !== optValue)
      : [...prev, optValue]);
  }, []);

  const selectedUsers = options.filter(o => selectedValues.includes(o.value));

  return (
    <Popover open={isEditing} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>
        <DataGridCellWrapper<TData>
          ref={containerRef}
          cell={cell}
          tableMeta={tableMeta}
          rowIndex={rowIndex}
          columnId={columnId}
          rowHeight={rowHeight}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          isSearchMatch={isSearchMatch}
          isActiveSearchMatch={isActiveSearchMatch}
          isChanged={isChanged}
          readOnly={readOnly}>
          <div
            data-slot="grid-cell-content"
            className="flex items-center gap-1"
            style={{ WebkitLineClamp: 'unset', WebkitBoxOrient: 'initial', overflow: 'visible' }}>
            {selectedUsers.slice(0, 3).map(u => (
              <Avatar key={u.value} className="size-5 rounded-md">
                {u.avatarUrl ? (
                  <AvatarImage src={u.avatarUrl} alt={u.label} />
                ) : null}
                <AvatarFallback className="rounded-md text-[10px]">
                  {getInitials(u.label, u.initials)}
                </AvatarFallback>
              </Avatar>
            ))}
            {selectedUsers.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{selectedUsers.length - 3}
              </span>
            )}
          </div>
        </DataGridCellWrapper>
      </PopoverAnchor>
      <PopoverContent
        data-grid-cell-editor=""
        align="start"
        className="w-[250px] p-0"
        onOpenAutoFocus={e => e.preventDefault()}>
        <Command>
          <CommandInput placeholder="Search users..." />
          <CommandList>
            <CommandEmpty>No user found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isChecked = selectedValues.includes(option.value);

                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => toggleOption(option.value)}>
                    <div
                      className={cn(
                        'mr-2 flex size-4 items-center justify-center rounded-sm border border-primary',
                        isChecked
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50'
                      )}>
                      {isChecked && <Check className="size-3" />}
                    </div>
                    <UserOptionDisplay
                      label={option.label}
                      avatarUrl={option.avatarUrl}
                      initials={option.initials} />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function TagSelectCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isEditing,
  isFocused,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly
}: DataGridCellProps<TData>) {
  const initialValue = (cell.getValue() ?? []) as Array<string>;
  const [selectedValues, setSelectedValues] = useState<Array<string>>(
    Array.isArray(initialValue) ? initialValue : []
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const cellOpts = cell.column.columnDef.meta?.cell;
  const options: Array<CellSelectOption>
    = cellOpts?.variant === 'tag-select' ? cellOpts.options : [];

  const prevInitialValueRef = useRef(initialValue);

  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setSelectedValues(Array.isArray(initialValue) ? initialValue : []);
  }

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open && !readOnly) {
        tableMeta?.onCellEditingStart?.(rowIndex, columnId);
      } else {
        if (!readOnly) {
          tableMeta?.onDataUpdate?.({
            rowIndex,
            columnId,
            value: selectedValues
          });
        }
        tableMeta?.onCellEditingStop?.();
      }
    },
    [
      tableMeta,
      rowIndex,
      columnId,
      readOnly,
      selectedValues
    ]
  );

  const toggleOption = useCallback((optValue: string) => {
    setSelectedValues(prev => prev.includes(optValue)
      ? prev.filter(v => v !== optValue)
      : [...prev, optValue]);
  }, []);

  const selectedTags = options.filter(o => selectedValues.includes(o.value));

  return (
    <Popover open={isEditing} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>
        <DataGridCellWrapper<TData>
          ref={containerRef}
          cell={cell}
          tableMeta={tableMeta}
          rowIndex={rowIndex}
          columnId={columnId}
          rowHeight={rowHeight}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          isSearchMatch={isSearchMatch}
          isActiveSearchMatch={isActiveSearchMatch}
          isChanged={isChanged}
          readOnly={readOnly}>
          <div
            data-slot="grid-cell-content"
            className="flex items-center gap-1 overflow-hidden"
            style={{ WebkitLineClamp: 'unset', WebkitBoxOrient: 'initial' }}>
            {selectedTags.map(tag => (
              <Badge
                key={tag.value}
                variant="secondary"
                className="shrink-0 px-1.5 py-px text-xs">
                {tag.label}
              </Badge>
            ))}
          </div>
        </DataGridCellWrapper>
      </PopoverAnchor>
      <PopoverContent
        data-grid-cell-editor=""
        align="start"
        className="w-[250px] p-0"
        onOpenAutoFocus={e => e.preventDefault()}>
        <Command>
          <CommandInput placeholder="Search tags..." />
          <CommandList>
            <CommandEmpty>No tags found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isChecked = selectedValues.includes(option.value);

                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => toggleOption(option.value)}>
                    <div
                      className={cn(
                        'mr-2 flex size-4 items-center justify-center rounded-sm border border-primary',
                        isChecked
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50'
                      )}>
                      {isChecked && <Check className="size-3" />}
                    </div>
                    {option.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}