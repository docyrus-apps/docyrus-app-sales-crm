'use client';

import {
  forwardRef, useCallback, useImperativeHandle, useState
} from 'react';

import { Check, ChevronsUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import {
  type LogActivityPayload,
  type SectionHandle,
  type SelectorFieldConfig
} from '../types';

function HeaderSelector({
  field,
  selectedValue,
  popoverOpen,
  onPopoverOpenChange,
  onSelect,
  disabled
}: {
  field: SelectorFieldConfig;
  selectedValue: string | null;
  popoverOpen: boolean;
  onPopoverOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
  disabled: boolean;
}) {
  const selectedOpt = field.options.find(o => o.id === selectedValue);

  return (
    <Popover open={popoverOpen} onOpenChange={onPopoverOpenChange}>
      <PopoverTrigger asChild>
        {selectedOpt ? (
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'inline-flex max-w-48 items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium',
              selectedOpt.color ? undefined : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
              disabled && 'pointer-events-none opacity-50'
            )}
            style={selectedOpt.color ? {
              borderColor: `${selectedOpt.color}33`,
              backgroundColor: `${selectedOpt.color}11`,
              color: selectedOpt.color
            } : undefined}>
            {selectedOpt.color && (
              <span
                className="size-2 shrink-0 rounded-sm"
                style={{ backgroundColor: selectedOpt.color }} />
            )}
            <span className="truncate">{selectedOpt.label}</span>
            <ChevronsUpDown className="size-3 shrink-0 opacity-50" />
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'text-sm text-muted-foreground hover:text-foreground',
              disabled && 'pointer-events-none opacity-50'
            )}>
            {field.placeholder ?? field.label}
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0" align="start">
        <Command>
          <CommandInput placeholder={field.searchPlaceholder ?? 'Search...'} />
          <CommandList>
            <CommandEmpty>{field.emptyText ?? 'No results.'}</CommandEmpty>
            <CommandGroup>
              {field.options.map(opt => (
                <CommandItem
                  key={opt.id}
                  value={opt.label}
                  onSelect={() => onSelect(opt.id)}>
                  <Check
                    className={cn(
                      'mr-2 size-4',
                      selectedValue === opt.id ? 'opacity-100' : 'opacity-0'
                    )} />
                  {opt.icon}
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function FooterSelector({
  field,
  selectedValue,
  popoverOpen,
  onPopoverOpenChange,
  onSelect,
  disabled
}: {
  field: SelectorFieldConfig;
  selectedValue: string | null;
  popoverOpen: boolean;
  onPopoverOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
  disabled: boolean;
}) {
  const selectedOpt = field.options.find(o => o.id === selectedValue);

  return (
    <Popover open={popoverOpen} onOpenChange={onPopoverOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={cn(
            'gap-1.5 text-xs text-muted-foreground',
            selectedValue && 'text-blue-600'
          )}>
          {field.icon}
          <span className="truncate">
            {selectedOpt?.label ?? field.placeholder ?? field.label}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0" align="start">
        <Command>
          <CommandInput placeholder={field.searchPlaceholder ?? 'Search...'} />
          <CommandList>
            <CommandEmpty>{field.emptyText ?? 'No results.'}</CommandEmpty>
            <CommandGroup>
              {field.options.map(opt => (
                <CommandItem
                  key={opt.id}
                  value={opt.label}
                  onSelect={() => onSelect(opt.id)}>
                  <Check
                    className={cn(
                      'mr-2 size-4',
                      selectedValue === opt.id ? 'opacity-100' : 'opacity-0'
                    )} />
                  {opt.icon}
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface TaskSectionProps {
  headerFields?: Array<SelectorFieldConfig>;
  footerFields?: Array<SelectorFieldConfig>;
  disabled: boolean;
}

export const TaskSection = forwardRef<SectionHandle, TaskSectionProps>(
  ({ headerFields = [], footerFields = [], disabled }, ref) => {
    const [subject, setSubject] = useState('');
    const [fieldValues, setFieldValues] = useState<Record<string, string | null>>(() => {
      const initial: Record<string, string | null> = {};

      for (const f of [...headerFields, ...footerFields]) {
        initial[f.key] = f.defaultValue ?? null;
      }

      return initial;
    });
    const [popoverStates, setPopoverStates] = useState<Record<string, boolean>>({});

    const setFieldValue = useCallback(
      (key: string, value: string | null) => {
        setFieldValues((prev) => {
          const next = { ...prev, [key]: value };
          const allFields = [...headerFields, ...footerFields];
          const field = allFields.find(f => f.key === key);

          if (field?.clearsFields) {
            for (const clearKey of field.clearsFields) {
              next[clearKey] = null;
            }
          }

          return next;
        });
      },
      [headerFields, footerFields]
    );

    const setPopoverOpen = useCallback(
      (key: string, isOpen: boolean) => {
        setPopoverStates(prev => ({ ...prev, [key]: isOpen }));
      },
      []
    );

    useImperativeHandle(ref, () => ({
      getData: (): Partial<LogActivityPayload> => ({
        taskSubject: subject || undefined,
        taskFields: { ...fieldValues }
      }),
      reset: () => {
        setSubject('');

        const initial: Record<string, string | null> = {};

        for (const f of [...headerFields, ...footerFields]) {
          initial[f.key] = f.defaultValue ?? null;
        }

        setFieldValues(initial);
        setPopoverStates({});
      },
      isEmpty: () => !subject.trim()
    }));

    return (
      <div className="flex flex-col gap-2">
        {/* Header selectors */}
        {headerFields.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {headerFields.map((field, i) => (
              <span key={field.key} className="contents">
                {i > 0 && (
                  <span className="text-sm text-muted-foreground">/</span>
                )}
                <HeaderSelector
                  field={field}
                  selectedValue={fieldValues[field.key] ?? null}
                  popoverOpen={popoverStates[field.key] ?? false}
                  onPopoverOpenChange={isOpen => setPopoverOpen(field.key, isOpen)}
                  onSelect={(id) => {
                    setFieldValue(field.key, id);
                    setPopoverOpen(field.key, false);
                    field.onChange?.(id);
                  }}
                  disabled={disabled} />
              </span>
            ))}
          </div>
        )}

        {/* Subject */}
        <Input
          placeholder="Task subject"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          disabled={disabled}
          className="h-8 text-sm" />

        {/* Footer selectors */}
        {footerFields.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {footerFields.map(field => (
              <FooterSelector
                key={field.key}
                field={field}
                selectedValue={fieldValues[field.key] ?? null}
                popoverOpen={popoverStates[field.key] ?? false}
                onPopoverOpenChange={isOpen => setPopoverOpen(field.key, isOpen)}
                onSelect={(id) => {
                  const currentValue = fieldValues[field.key];
                  const newValue = currentValue === id ? null : id;

                  setFieldValue(field.key, newValue);
                  setPopoverOpen(field.key, false);
                  field.onChange?.(newValue);
                }}
                disabled={disabled} />
            ))}
          </div>
        )}
      </div>
    );
  }
);

TaskSection.displayName = 'TaskSection';