'use client';

import {
  useCallback, useEffect, useMemo, useRef, useState,
  type KeyboardEvent, type ReactNode
} from 'react';

import {
  CheckIcon, ChevronDownIcon, ChevronsUpDownIcon,
  PlusIcon, SparklesIcon, XIcon
} from 'lucide-react';
import { Popover as PopoverPrimitive } from 'radix-ui';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import { tUi, type UiI18nLocale } from '@/lib/ui-i18n';

interface MentionOption {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
}

interface MentionTriggerConfig {
  trigger: string;
  options: MentionOption[];
  searchPlaceholder?: string;
  emptyText?: string;
}

interface MentionSelection {
  trigger: string;
  option: MentionOption;
  field: 'subject' | 'description';
}

interface SelectorOption {
  id: string;
  label: string;
  icon?: ReactNode;
  color?: string;
}

interface SelectorFieldConfig {
  key: string;
  label: string;
  placeholder?: string;
  icon?: ReactNode;
  options: SelectorOption[];
  value?: string | null;
  defaultValue?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  onChange?: (value: string | null) => void;
  clearsFields?: string[];
}

interface FooterToggleConfig {
  key: string;
  label: string;
  defaultChecked?: boolean;
}

interface AiAction {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  onAction: (ctx: { subject: string; description: string }) => void | Promise<void>;
}

interface CreateRecordFormData {
  subject: string;
  description: string;
  fields: Record<string, string | null>;
  toggles: Record<string, boolean>;
  mentions: MentionSelection[];
}

interface CreateRecordDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;

  headerIcon?: ReactNode;
  headerLabel?: string;
  headerFields?: SelectorFieldConfig[];

  subjectPlaceholder?: string;
  descriptionPlaceholder?: string;
  descriptionExpanded?: boolean;

  footerFields?: SelectorFieldConfig[];
  footerToggles?: FooterToggleConfig[];

  mentionTriggers?: MentionTriggerConfig[];
  onMentionSelect?: (selection: MentionSelection) => void;

  aiActions?: AiAction[];

  enableCreateMore?: boolean;
  createMoreResetKeys?: string[];

  onSubmit: (data: CreateRecordFormData) => void | Promise<void>;
  isPending?: boolean;

  locale?: UiI18nLocale;
  saveLabel?: string;
  cancelLabel?: string;
  createMoreLabel?: string;
  addDescriptionLabel?: string;
  dialogTitle?: string;

  className?: string;
}

interface TriggerState {
  trigger: string;
  field: 'subject' | 'description';
  startIndex: number;
  search: string;
  highlightIndex: number;
}

function detectTrigger(
  text: string,
  cursorPos: number,
  triggers: string[]
): { trigger: string; startIndex: number; search: string } | null {
  const before = text.slice(0, cursorPos);

  for (const char of triggers) {
    const idx = before.lastIndexOf(char);

    if (idx === -1) continue;
    if (idx > 0 && before[idx - 1] !== ' ') continue;

    const search = before.slice(idx + char.length);

    if (search.includes(' ')) continue;

    return { trigger: char, startIndex: idx, search };
  }

  return null;
}

function MentionList({
  items,
  highlightIndex,
  onSelect,
  onHighlight,
  emptyText
}: {
  items: MentionOption[];
  highlightIndex: number;
  onSelect: (item: MentionOption) => void;
  onHighlight: (index: number) => void;
  emptyText: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;

    if (!list) return;

    const highlighted = list.children[highlightIndex] as HTMLElement | undefined;

    highlighted?.scrollIntoView({ block: 'nearest' });
  }, [highlightIndex]);

  if (items.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }

  return (
    <div ref={listRef} role="listbox" className="max-h-60 overflow-y-auto">
      {items.map((item, i) => (
        <button
          key={item.id}
          type="button"
          role="option"
          aria-selected={i === highlightIndex}
          className={cn(
            'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
            i === highlightIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
          )}
          onMouseDown={e => e.preventDefault()}
          onClick={() => onSelect(item)}
          onMouseEnter={() => onHighlight(i)}>
          {item.icon}
          <span className="truncate">{item.label}</span>
          {item.description && (
            <span className="ml-auto truncate text-xs text-muted-foreground">
              {item.description}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function HeaderSelector({
  field,
  selectedLabel,
  color,
  popoverOpen,
  onPopoverOpenChange,
  onSelect,
  locale
}: {
  field: SelectorFieldConfig;
  selectedLabel: string | null;
  color?: string;
  popoverOpen: boolean;
  onPopoverOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
  locale?: UiI18nLocale;
}) {
  return (
    <Popover open={popoverOpen} onOpenChange={onPopoverOpenChange}>
      <PopoverTrigger asChild>
        {selectedLabel ? (
          <button
            type="button"
            className={cn(
              'inline-flex max-w-48 items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium',
              color ? undefined : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
            )}
            style={color ? {
              borderColor: `${color}33`,
              backgroundColor: `${color}11`,
              color
            } : undefined}>
            <span
              className="size-2 shrink-0 rounded-sm"
              style={{ backgroundColor: color ?? 'rgb(59,130,246)' }} />
            <span className="truncate">{selectedLabel}</span>
            <ChevronsUpDownIcon className="size-3 shrink-0 opacity-50" />
          </button>
        ) : (
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground">
            {field.placeholder ?? field.label}
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0" align="start">
        <Command>
          <CommandInput
            placeholder={field.searchPlaceholder ?? tUi(locale, 'searchPlaceholder')} />
          <CommandList>
            <CommandEmpty>
              {field.emptyText ?? tUi(locale, 'crdNoResults')}
            </CommandEmpty>
            <CommandGroup>
              {field.options.map(opt => (
                <CommandItem
                  key={opt.id}
                  value={opt.label}
                  onSelect={() => onSelect(opt.id)}>
                  <CheckIcon
                    className={cn(
                      'mr-2 size-4',
                      field.value === opt.id ? 'opacity-100' : 'opacity-0'
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
  selectedLabel,
  popoverOpen,
  onPopoverOpenChange,
  onSelect,
  locale
}: {
  field: SelectorFieldConfig;
  selectedLabel: string | null;
  popoverOpen: boolean;
  onPopoverOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
  locale?: UiI18nLocale;
}) {
  return (
    <Popover open={popoverOpen} onOpenChange={onPopoverOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'gap-1.5 text-muted-foreground',
            field.value && 'text-blue-600'
          )}>
          {field.icon}
          <span className="truncate">
            {selectedLabel ?? field.placeholder ?? field.label}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0" align="start">
        <Command>
          <CommandInput
            placeholder={field.searchPlaceholder ?? tUi(locale, 'searchPlaceholder')} />
          <CommandList>
            <CommandEmpty>
              {field.emptyText ?? tUi(locale, 'crdNoResults')}
            </CommandEmpty>
            <CommandGroup>
              {field.options.map(opt => (
                <CommandItem
                  key={opt.id}
                  value={opt.label}
                  onSelect={() => onSelect(opt.id)}>
                  <CheckIcon
                    className={cn(
                      'mr-2 size-4',
                      field.value === opt.id ? 'opacity-100' : 'opacity-0'
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

export function CreateRecordDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  children,

  headerIcon,
  headerLabel,
  headerFields = [],

  subjectPlaceholder,
  descriptionPlaceholder,
  descriptionExpanded = false,

  footerFields = [],
  footerToggles = [],

  mentionTriggers = [],
  onMentionSelect,

  aiActions = [],

  enableCreateMore = false,
  createMoreResetKeys = ['subject', 'description'],

  onSubmit,
  isPending = false,

  locale,
  saveLabel,
  cancelLabel,
  createMoreLabel,
  addDescriptionLabel,
  dialogTitle,

  className
}: CreateRecordDialogProps) {

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (v: boolean) => {
      if (!isControlled) setInternalOpen(v);
      controlledOnOpenChange?.(v);
    },
    [isControlled, controlledOnOpenChange]
  );

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(descriptionExpanded);
  const [createMore, setCreateMore] = useState(false);

  const [fieldValues, setFieldValues] = useState<Record<string, string | null>>({});
  const [toggleValues, setToggleValues] = useState<Record<string, boolean>>({});

  const [popoverStates, setPopoverStates] = useState<Record<string, boolean>>({});

  const [trigger, setTrigger] = useState<TriggerState | null>(null);
  const [mentions, setMentions] = useState<MentionSelection[]>([]);

  const subjectRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const labels = useMemo(() => ({
    save: saveLabel ?? tUi(locale, 'crdSave'),
    cancel: cancelLabel ?? tUi(locale, 'crdCancel'),
    createMore: createMoreLabel ?? tUi(locale, 'crdCreateMore'),
    addDescription: addDescriptionLabel ?? tUi(locale, 'crdAddDescription'),
    subjectPlaceholder: subjectPlaceholder ?? tUi(locale, 'crdSubjectPlaceholder'),
    descriptionPlaceholder: descriptionPlaceholder ?? tUi(locale, 'crdDescriptionPlaceholder'),
    dialogTitle: dialogTitle ?? tUi(locale, 'crdDialogTitle'),
    noResults: tUi(locale, 'crdNoResults')
  }), [
    locale,
    saveLabel,
    cancelLabel,
    createMoreLabel,
    addDescriptionLabel,
    subjectPlaceholder,
    descriptionPlaceholder,
    dialogTitle
  ]);

  const triggerChars = useMemo(
    () => mentionTriggers.map(t => t.trigger),
    [mentionTriggers]
  );

  useEffect(() => {
    if (open) {
      setSubject('');
      setDescription('');
      setShowDescription(descriptionExpanded);
      setCreateMore(false);
      setTrigger(null);
      setMentions([]);
      setPopoverStates({});

      const initialFields: Record<string, string | null> = {};

      for (const f of [...headerFields, ...footerFields]) {
        initialFields[f.key] = f.defaultValue ?? null;
      }

      setFieldValues(initialFields);

      const initialToggles: Record<string, boolean> = {};

      for (const t of footerToggles) {
        initialToggles[t.key] = t.defaultChecked ?? false;
      }

      setToggleValues(initialToggles);

      requestAnimationFrame(() => subjectRef.current?.focus());
    }
  }, [
    open,
    descriptionExpanded,
    headerFields,
    footerFields,
    footerToggles
  ]);

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

  const resolvedFieldLabels = useMemo(() => {
    const result: Record<string, string | null> = {};
    const allFields = [...headerFields, ...footerFields];

    for (const f of allFields) {
      const selectedId = fieldValues[f.key];

      if (!selectedId) {
        result[f.key] = null;
        continue;
      }

      const opt = f.options.find(o => o.id === selectedId);

      result[f.key] = opt?.label ?? null;
    }

    return result;
  }, [headerFields, footerFields, fieldValues]);

  const mentionItems = useMemo<MentionOption[]>(() => {
    if (!trigger) return [];

    const config = mentionTriggers.find(t => t.trigger === trigger.trigger);

    if (!config) return [];

    const search = trigger.search.toLowerCase();

    return config.options
      .filter(o => o.label.toLowerCase().includes(search))
      .slice(0, 8);
  }, [trigger, mentionTriggers]);

  const activeMentionConfig = useMemo(
    () => trigger ? mentionTriggers.find(t => t.trigger === trigger.trigger) : null,
    [trigger, mentionTriggers]
  );

  const selectMentionItem = useCallback(
    (item: MentionOption) => {
      if (!trigger) return;

      const { field, startIndex, search } = trigger;

      const removeTrigger = (prev: string) => {
        const before = prev.slice(0, startIndex);
        const after = prev.slice(startIndex + trigger.trigger.length + search.length);

        return before + after;
      };

      if (field === 'subject') setSubject(removeTrigger);
      else setDescription(removeTrigger);

      const selection: MentionSelection = {
        trigger: trigger.trigger,
        option: item,
        field
      };

      setMentions(prev => [...prev, selection]);
      onMentionSelect?.(selection);

      setTrigger(null);

      requestAnimationFrame(() => {
        if (field === 'subject') subjectRef.current?.focus();
        else descriptionRef.current?.focus();
      });
    },
    [trigger, onMentionSelect]
  );

  const handleInputChange = useCallback(
    (value: string, cursorPos: number, field: 'subject' | 'description') => {
      if (field === 'subject') setSubject(value);
      else setDescription(value);

      if (triggerChars.length === 0) return;

      const detected = detectTrigger(value, cursorPos, triggerChars);

      if (detected) {
        setTrigger({
          ...detected,
          field,
          highlightIndex: 0
        });
      } else {
        setTrigger(null);
      }
    },
    [triggerChars]
  );

  const handleSave = useCallback(async () => {
    if (!subject.trim() || isPending) return;

    const data: CreateRecordFormData = {
      subject: subject.trim(),
      description: description.trim(),
      fields: { ...fieldValues },
      toggles: { ...toggleValues },
      mentions: [...mentions]
    };

    await onSubmit(data);

    if (createMore) {
      if (createMoreResetKeys.includes('subject')) setSubject('');

      if (createMoreResetKeys.includes('description')) {
        setDescription('');
        setShowDescription(descriptionExpanded);
      }

      setFieldValues((prev) => {
        const next = { ...prev };

        for (const key of createMoreResetKeys) {
          if (key !== 'subject' && key !== 'description' && key in next) {
            next[key] = null;
          }
        }

        return next;
      });

      setMentions([]);
      setTrigger(null);
      requestAnimationFrame(() => subjectRef.current?.focus());
    } else {
      setOpen(false);
    }
  }, [
    subject,
    description,
    fieldValues,
    toggleValues,
    mentions,
    onSubmit,
    createMore,
    createMoreResetKeys,
    descriptionExpanded,
    isPending,
    setOpen
  ]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent, field: 'subject' | 'description') => {
      if (trigger && trigger.field === field) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setTrigger(prev => prev ? { ...prev, highlightIndex: Math.min(prev.highlightIndex + 1, mentionItems.length - 1) } : null);

          return;
        }

        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setTrigger(prev => prev ? { ...prev, highlightIndex: Math.max(prev.highlightIndex - 1, 0) } : null);

          return;
        }

        if (e.key === 'Enter' && mentionItems.length > 0) {
          e.preventDefault();
          const item = mentionItems[trigger.highlightIndex];

          if (item) selectMentionItem(item);

          return;
        }

        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          setTrigger(null);

          return;
        }
      }

      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      }
    },
    [
      trigger,
      mentionItems,
      selectMentionItem,
      handleSave
    ]
  );

  const handleHeaderFieldSelect = useCallback(
    (fieldKey: string, id: string) => {
      setFieldValue(fieldKey, id);
      setPopoverOpen(fieldKey, false);

      const field = headerFields.find(f => f.key === fieldKey);

      field?.onChange?.(id);
    },
    [headerFields, setFieldValue, setPopoverOpen]
  );

  const handleFooterFieldSelect = useCallback(
    (fieldKey: string, id: string) => {
      const currentValue = fieldValues[fieldKey];
      const newValue = currentValue === id ? null : id;

      setFieldValue(fieldKey, newValue);
      setPopoverOpen(fieldKey, false);

      const field = footerFields.find(f => f.key === fieldKey);

      field?.onChange?.(newValue);
    },
    [
      fieldValues,
      footerFields,
      setFieldValue,
      setPopoverOpen
    ]
  );

  const renderMentionPopover = useCallback(
    () => (
      <PopoverPrimitive.Content
        data-slot="popover-content"
        className="bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-60 origin-(--radix-popover-content-transform-origin) rounded-md border p-1 shadow-md outline-hidden"
        align="start"
        sideOffset={8}
        onOpenAutoFocus={e => e.preventDefault()}
        onCloseAutoFocus={e => e.preventDefault()}>
        <MentionList
          items={mentionItems}
          highlightIndex={trigger?.highlightIndex ?? 0}
          onSelect={selectMentionItem}
          onHighlight={idx => setTrigger(prev => (prev ? { ...prev, highlightIndex: idx } : null))}
          emptyText={activeMentionConfig?.emptyText ?? labels.noResults} />
      </PopoverPrimitive.Content>
    ),
    [
      mentionItems,
      trigger?.highlightIndex,
      selectMentionItem,
      activeMentionConfig,
      labels.noResults
    ]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        showCloseButton={false}
        className={cn('sm:max-w-3xl gap-0 p-0', className)}
        onEscapeKeyDown={(e) => {
          if (trigger) {
            e.preventDefault();
            setTrigger(null);
          }
        }}
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement;

          if (target.closest('[data-slot="popover-content"]')) {
            e.preventDefault();
          }
        }}>
        <DialogTitle className="sr-only">{labels.dialogTitle}</DialogTitle>
        <DialogDescription className="sr-only">
          {labels.dialogTitle}
        </DialogDescription>

        {/* ─── Header ───────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-3">
          {headerIcon && (
            <span className="size-4 shrink-0 text-muted-foreground [&>svg]:size-4">
              {headerIcon}
            </span>
          )}

          {headerLabel && (
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {headerLabel}
            </span>
          )}

          {headerFields.map((field, i) => {
            const selectedOpt = field.options.find(
              o => o.id === (fieldValues[field.key] ?? field.value)
            );

            return (
              <span key={field.key} className="contents">
                {i > 0 && (
                  <span className="text-sm text-muted-foreground">/</span>
                )}
                <HeaderSelector
                  field={{ ...field, value: fieldValues[field.key] ?? field.value ?? null }}
                  selectedLabel={resolvedFieldLabels[field.key] ?? null}
                  color={selectedOpt?.color}
                  popoverOpen={popoverStates[field.key] ?? false}
                  onPopoverOpenChange={isOpen => setPopoverOpen(field.key, isOpen)}
                  onSelect={id => handleHeaderFieldSelect(field.key, id)}
                  locale={locale} />
              </span>
            );
          })}

          <DialogClose className="ml-auto rounded-sm opacity-70 transition-opacity hover:opacity-100">
            <XIcon className="size-4" />
            <span className="sr-only">{tUi(locale, 'close')}</span>
          </DialogClose>
        </div>

        <div className="border-t" />

        {/* ─── Body ─────────────────────────────────────── */}
        <div className="min-h-50 px-4 py-4">
          {/* Subject input + AI Actions */}
          <div className="flex items-start gap-2">
            <div className="relative flex-1">
              <PopoverPrimitive.Root open={!!trigger && trigger.field === 'subject'}>
                <PopoverPrimitive.Anchor asChild>
                  <input
                    ref={subjectRef}
                    type="text"
                    placeholder={labels.subjectPlaceholder}
                    value={subject}
                    className="w-full bg-transparent text-lg font-semibold outline-none placeholder:text-muted-foreground"
                    onChange={(e) => {
                      handleInputChange(
                        e.target.value,
                        e.target.selectionStart ?? 0,
                        'subject'
                      );
                    }}
                    onKeyDown={e => handleKeyDown(e, 'subject')} />
                </PopoverPrimitive.Anchor>
                {renderMentionPopover()}
              </PopoverPrimitive.Root>
            </div>

            {aiActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50">
                    <SparklesIcon className="size-3.5" />
                    AI
                    <ChevronDownIcon className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {aiActions.map(action => (
                    <DropdownMenuItem
                      key={action.id}
                      disabled={action.disabled}
                      onClick={() => action.onAction({ subject, description })}>
                      {action.icon}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Description */}
          <div className="mt-3">
            {showDescription ? (
              <div className="border-t pt-3">
                <PopoverPrimitive.Root open={!!trigger && trigger.field === 'description'}>
                  <PopoverPrimitive.Anchor asChild>
                    <textarea
                      ref={descriptionRef}
                      placeholder={labels.descriptionPlaceholder}
                      value={description}
                      className="w-full min-h-25 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      onChange={(e) => {
                        handleInputChange(
                          e.target.value,
                          e.target.selectionStart ?? 0,
                          'description'
                        );
                      }}
                      onKeyDown={e => handleKeyDown(e, 'description')} />
                  </PopoverPrimitive.Anchor>
                  {renderMentionPopover()}
                </PopoverPrimitive.Root>
              </div>
            ) : (
              <button
                type="button"
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
                onClick={() => {
                  setShowDescription(true);
                  requestAnimationFrame(() => descriptionRef.current?.focus());
                }}>
                <PlusIcon className="size-3.5" />
                {labels.addDescription}
              </button>
            )}
          </div>
        </div>

        {/* ─── Footer ───────────────────────────────────── */}
        <div className="flex flex-col gap-2 border-t px-4 py-2.5 sm:flex-row sm:items-center sm:gap-1">
          {/* Metadata selectors + toggles row */}
          <div className="flex items-center gap-1">
            {footerFields.map(field => (
              <FooterSelector
                key={field.key}
                field={{ ...field, value: fieldValues[field.key] ?? field.value ?? null }}
                selectedLabel={resolvedFieldLabels[field.key] ?? null}
                popoverOpen={popoverStates[field.key] ?? false}
                onPopoverOpenChange={isOpen => setPopoverOpen(field.key, isOpen)}
                onSelect={id => handleFooterFieldSelect(field.key, id)}
                locale={locale} />
            ))}

            {footerToggles.map(toggle => (
              <label
                key={toggle.key}
                className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground">
                <Switch
                  checked={toggleValues[toggle.key] ?? false}
                  onCheckedChange={checked => setToggleValues(prev => ({ ...prev, [toggle.key]: checked }))}
                  className="scale-75" />
                {toggle.label}
              </label>
            ))}
          </div>

          {/* Actions row */}
          <div className="flex items-center gap-3 sm:ml-auto">
            {enableCreateMore && (
              <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground">
                <Switch
                  checked={createMore}
                  onCheckedChange={setCreateMore}
                  className="scale-75" />
                {labels.createMore}
              </label>
            )}

            <div className="ml-auto flex items-center gap-2 sm:ml-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}>
                {labels.cancel}
                <kbd className="ml-1.5 pointer-events-none hidden rounded border bg-muted px-1 text-[10px] text-muted-foreground sm:inline-block">
                  ESC
                </kbd>
              </Button>

              <Button
                size="sm"
                onClick={handleSave}
                disabled={isPending || !subject.trim()}
                className="bg-blue-600 hover:bg-blue-700">
                {labels.save}
                <kbd className="ml-1.5 pointer-events-none hidden rounded border border-white/20 bg-white/10 px-1 text-[10px] sm:inline-block">
                  ⌘↵
                </kbd>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type {
  CreateRecordDialogProps,
  CreateRecordFormData,
  SelectorFieldConfig,
  SelectorOption,
  FooterToggleConfig,
  MentionTriggerConfig,
  MentionOption,
  MentionSelection,
  AiAction
};