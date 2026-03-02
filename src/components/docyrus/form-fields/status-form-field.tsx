'use client';

import {
  useCallback, useEffect, useMemo, useRef, useState
} from 'react';

import {
  CalendarIcon, Check, ChevronRight, ChevronsUpDown
} from 'lucide-react';
import { format } from 'date-fns';

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import {
  getCompanionFieldSlug,
  getEnumDotClassName,
  getEnumDotStyle,
  getEnumIconColor
} from './lib/utils';
import { type DocyrusFormFieldProps, type EnumOption } from './types';

function formatCompactDate(iso: string): { line1: string; line2: string } {
  const d = new Date(iso);
  const day = d.getDate();
  const suffixes = [
    'th',
    'st',
    'nd',
    'rd'
  ];
  const v = day % 100;
  const suffix = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];

  return {
    line1: `${day}${suffix}`,
    line2: `${format(d, 'MMM')} '${format(d, 'yy')}`
  };
}

interface StatusDraft {
  status: string;
  secondary: string;
  description: string;
  followupDate: string | null;
}

export function StatusFormField({
  field: fieldConfig,
  form,
  disabled,
  className,
  enumOptions = []
}: DocyrusFormFieldProps) {
  const secondarySlug = getCompanionFieldSlug(fieldConfig.slug, 'secondary');
  const descriptionSlug = getCompanionFieldSlug(
    fieldConfig.slug,
    'description'
  );
  const followupDateSlug = getCompanionFieldSlug(
    fieldConfig.slug,
    'followup_date'
  );

  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => (
        <StatusFormFieldInner
          field={field}
          fieldConfig={fieldConfig}
          form={form}
          disabled={disabled}
          className={className}
          enumOptions={enumOptions}
          secondarySlug={secondarySlug}
          descriptionSlug={descriptionSlug}
          followupDateSlug={followupDateSlug} />
      )} />
  );
}

function StatusFormFieldInner({
  field,
  fieldConfig,
  form,
  disabled,
  className,
  enumOptions,
  secondarySlug,
  descriptionSlug,
  followupDateSlug
}: {
  field: any;
  fieldConfig: DocyrusFormFieldProps['field'];
  form: any;
  disabled?: boolean;
  className?: string;
  enumOptions: Array<EnumOption>;
  secondarySlug: string;
  descriptionSlug: string;
  followupDateSlug: string;
}) {
  const isInvalid
    = field.state.meta.isTouched && !field.state.meta.isValid;
  const currentValue = field.state.value ?? '';
  const isDisabled = disabled || fieldConfig.readOnly === true;

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<StatusDraft>({
    status: '',
    secondary: '',
    description: '',
    followupDate: null
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const [committed, setCommitted] = useState<Omit<StatusDraft, 'status'>>({
    secondary: '',
    description: '',
    followupDate: null
  });

  const secondaryRef = useRef<any>(null);
  const descriptionRef = useRef<any>(null);
  const followupRef = useRef<any>(null);

  const parentOptions = useMemo(
    () => enumOptions.filter(o => !o.parent),
    [enumOptions]
  );

  const selectedOption = enumOptions.find(o => o.id === currentValue);

  const secondaryOption = enumOptions.find(o => o.id === committed.secondary);
  const hasCompanionData = !!(committed.secondary || committed.description || committed.followupDate);

  const childOptionsForDraft = useMemo(
    () => enumOptions.filter(o => o.parent === draft.status),
    [enumOptions, draft.status]
  );

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        setDraft({
          status: field.state.value ?? '',
          secondary: '',
          description: '',
          followupDate: null
        });
        /*
         * We need to read companion fields from the form, but since they
         * are separate form fields we'll read them after render
         */
        setDatePickerOpen(false);
      }
      setOpen(isOpen);
    },
    [field.state.value]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setCommitted({
        secondary: secondaryRef.current?.state?.value ?? '',
        description: descriptionRef.current?.state?.value ?? '',
        followupDate: followupRef.current?.state?.value ?? null
      });
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      setDraft(prev => ({
        ...prev,
        secondary: secondaryRef.current?.state?.value ?? '',
        description: descriptionRef.current?.state?.value ?? '',
        followupDate: followupRef.current?.state?.value ?? null
      }));
    }, 0);

    return () => clearTimeout(timer);
  }, [open]);

  const handleSelectStatus = useCallback(
    (statusId: string) => {
      setDraft(prev => ({
        ...prev,
        status: statusId,
        secondary: statusId === prev.status ? prev.secondary : ''
      }));
    },
    []
  );

  const handleConfirm = useCallback(
    () => {
      field.handleChange(draft.status);

      if (secondaryRef.current) {
        secondaryRef.current.handleChange(draft.secondary);
      }
      if (descriptionRef.current) {
        descriptionRef.current.handleChange(draft.description);
      }
      if (followupRef.current) {
        followupRef.current.handleChange(draft.followupDate);
      }

      setCommitted({
        secondary: draft.secondary,
        description: draft.description,
        followupDate: draft.followupDate
      });

      setOpen(false);
    },
    [field, draft]
  );

  return (
    <Field data-invalid={isInvalid} className={className}>
      <FieldLabel htmlFor={field.name}>{fieldConfig.name}</FieldLabel>

      {/* Hidden companion fields to sync with form */}
      <form.Field
        name={secondarySlug}
        children={(f: any) => {
          secondaryRef.current = f;

          return null;
        }} />
      <form.Field
        name={descriptionSlug}
        children={(f: any) => {
          descriptionRef.current = f;

          return null;
        }} />
      <form.Field
        name={followupDateSlug}
        children={(f: any) => {
          followupRef.current = f;

          return null;
        }} />

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id={field.name}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={isInvalid}
            onBlur={field.handleBlur}
            disabled={isDisabled}
            className={cn(
              'w-full justify-between',
              selectedOption && hasCompanionData && 'h-auto py-1.5'
            )}>
            {selectedOption ? (
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  {/* Line 1: Status breadcrumb badges */}
                  <span className="flex items-center gap-1">
                    <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-xs font-medium">
                      <StatusOptionLabel option={selectedOption} />
                    </Badge>
                    {secondaryOption && (
                      <>
                        <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
                        <Badge variant="outline" className="gap-1 px-1.5 py-0 text-xs font-normal">
                          <StatusOptionLabel option={secondaryOption} />
                        </Badge>
                      </>
                    )}
                  </span>
                  {/* Line 2: Description truncated */}
                  {committed.description && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="truncate text-left text-xs text-muted-foreground">
                            {committed.description}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          {committed.description}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                {/* Follow-up date — right-aligned, two-line compact format */}
                {committed.followupDate && (
                  <span className="flex shrink-0 flex-col items-center text-[10px] leading-tight text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {formatCompactDate(committed.followupDate).line1}
                    </span>
                    <span>{formatCompactDate(committed.followupDate).line2}</span>
                  </span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">Select status...</span>
            )}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-0"
          align="start">
          <div className="flex flex-col">
            {/* Status list */}
            <div className="max-h-48 overflow-y-auto p-1">
              {parentOptions.map(option => (
                <button
                  key={option.id}
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    draft.status === option.id && 'bg-accent'
                  )}
                  onClick={() => handleSelectStatus(option.id)}>
                  <Check
                    className={cn(
                      'size-4 shrink-0',
                      draft.status === option.id
                        ? 'opacity-100'
                        : 'opacity-0'
                    )} />
                  <StatusOptionLabel option={option} />
                </button>
              ))}
            </div>

            {/* Inline form — always visible when a status is selected */}
            {draft.status && (
              <>
                <Separator />
                <div className="flex flex-col gap-3 p-3">
                  {/* Sub-status select (conditional on child options) */}
                  {childOptionsForDraft.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Sub-status</Label>
                      <Select
                        value={draft.secondary}
                        onValueChange={v => setDraft(prev => ({ ...prev, secondary: v }))}>
                        <SelectTrigger className="h-8 w-full text-xs">
                          <SelectValue placeholder="Select reason..." />
                        </SelectTrigger>
                        <SelectContent>
                          {childOptionsForDraft.map(option => (
                            <SelectItem key={option.id} value={option.id}>
                              <StatusOptionLabel option={option} />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Notes textarea */}
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Notes</Label>
                    <Textarea
                      value={draft.description}
                      onChange={e => setDraft(prev => ({
                        ...prev,
                        description: e.target.value
                      }))}
                      placeholder="Add notes..."
                      className="min-h-16 resize-none text-xs" />
                  </div>

                  {/* Follow-up date */}
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Follow-up date</Label>
                    <Popover
                      open={datePickerOpen}
                      onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            'w-full justify-start text-left text-xs font-normal',
                            !draft.followupDate && 'text-muted-foreground'
                          )}>
                          <CalendarIcon className="mr-2 size-3.5" />
                          {draft.followupDate
                            ? format(new Date(draft.followupDate), 'PPP')
                            : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            draft.followupDate
                              ? new Date(draft.followupDate)
                              : undefined
                          }
                          onSelect={(date) => {
                            setDraft(prev => ({
                              ...prev,
                              followupDate: date
                                ? date.toISOString()
                                : null
                            }));
                            setDatePickerOpen(false);
                          }} />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Confirm button */}
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={handleConfirm}>
                    Confirm
                  </Button>
                </div>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

function StatusOptionLabel({ option }: { option: EnumOption }) {
  const iconColor = getEnumIconColor(option.color);

  return (
    <span className="flex items-center gap-2">
      {option.icon ? (
        <span
          className={iconColor.className}
          style={iconColor.style}>
          <DocyrusIcon
            icon={option.icon}
            className="size-4 shrink-0" />
        </span>
      ) : option.color ? (
        <Badge
          className={cn(
            'size-2.5 shrink-0 rounded-full p-0',
            getEnumDotClassName(option.color)
          )}
          style={getEnumDotStyle(option.color)} />
      ) : null}
      {option.name}
    </span>
  );
}