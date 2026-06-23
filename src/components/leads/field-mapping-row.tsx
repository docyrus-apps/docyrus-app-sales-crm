import { ArrowRight, RotateCcw, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export type FieldKind =
  | 'text'
  | 'email'
  | 'phone'
  | 'url'
  | 'number'
  | 'money'
  | 'date'
  | 'textarea'
  | 'select'

export interface SelectOption {
  value: string
  label: string
}

export interface FieldMappingRowProps {
  label: string
  sourceLabel?: string
  targetLabel: string
  sourceValue?: string
  value: string
  kind?: FieldKind
  options?: Array<SelectOption>
  placeholder?: string
  disabled?: boolean
  onChange: (next: string) => void
  onRestoreSource?: () => void
  onRemove?: () => void
  highlight?: boolean
  required?: boolean
  fieldKey?: string
}

export function FieldMappingRow({
  label,
  sourceValue,
  value,
  kind = 'text',
  options,
  placeholder,
  disabled,
  onChange,
  onRestoreSource,
  onRemove,
  highlight,
  required,
  fieldKey,
}: FieldMappingRowProps) {
  const { t } = useTranslation()
  const hasSourceValue = Boolean(sourceValue?.trim())
  const sourceDisplay = hasSourceValue ? sourceValue : ''
  const canRestoreSource = Boolean(
    sourceValue?.trim() && onRestoreSource && !disabled,
  )

  return (
    <div
      data-field-key={fieldKey}
      className={cn(
        'group rounded-lg border border-border/70 bg-linear-to-br from-card via-card to-muted/[0.16] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition-colors',
        required && 'border-rose-200/80 dark:border-rose-900/40',
        highlight &&
          'border-primary/35 bg-linear-to-br from-primary/[0.03] via-card to-sky-500/[0.035]',
      )}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Label className="truncate text-xs font-medium text-foreground/90">
            {label}
          </Label>
          {required ? (
            <span className="rounded-full border border-rose-200/80 bg-rose-50/80 px-2 py-0.5 text-[10px] font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/25 dark:text-rose-200">
              {t('leads.convert.requiredField', {
                defaultValue: 'Required',
              })}
            </span>
          ) : null}
        </div>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="rounded p-0.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 disabled:cursor-not-allowed"
            aria-label={t('common.delete')}
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>
      <div
        className={cn(
          'grid grid-cols-1 items-stretch gap-2 sm:grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)]',
        )}
      >
        <div
          className={cn(
            'min-w-0 rounded-md border px-3 py-1.5 text-xs',
            hasSourceValue
              ? 'border-sky-200/70 bg-sky-50/75 dark:border-sky-900/50 dark:bg-sky-950/20'
              : 'border-dashed border-muted-foreground/25 bg-muted/20 text-muted-foreground dark:bg-muted/10',
          )}
        >
          {hasSourceValue ? (
            <div className="flex min-w-0 items-center gap-1">
              <span
                className="truncate text-foreground/80"
                title={sourceDisplay}
              >
                {sourceDisplay}
              </span>
              {canRestoreSource ? (
                <button
                  type="button"
                  onClick={onRestoreSource}
                  className="ml-auto rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-background/80 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                  aria-label={t('leads.convert.restoreFromSource', {
                    defaultValue: 'Restore from lead',
                  })}
                  title={t('leads.convert.restoreFromSource', {
                    defaultValue: 'Restore from lead',
                  })}
                >
                  <RotateCcw className="size-3" />
                </button>
              ) : null}
            </div>
          ) : (
            <div className="text-xs leading-5">
              {t('leads.convert.noSourceMatch', {
                defaultValue: 'No matching lead value',
              })}
            </div>
          )}
        </div>
        <div
          className="hidden h-full items-center justify-center sm:flex"
          aria-hidden
        >
          <div className="flex h-7 w-8 items-center justify-center rounded-md border border-border/70 bg-background/90 text-muted-foreground/70 shadow-sm">
            <ArrowRight className="size-3.5" />
          </div>
        </div>
        <div className="min-w-0 rounded-md border border-emerald-200/70 bg-emerald-50/70 p-2 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          {kind === 'textarea' ? (
            <Textarea
              value={value}
              disabled={disabled}
              onChange={(event) => onChange(event.target.value)}
              placeholder={placeholder}
              rows={2}
            />
          ) : kind === 'select' ? (
            <Select value={value} disabled={disabled} onValueChange={onChange}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder={placeholder ?? t('common.select')} />
              </SelectTrigger>
              <SelectContent>
                {(options ?? []).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type={
                kind === 'email'
                  ? 'email'
                  : kind === 'phone'
                    ? 'tel'
                    : kind === 'url'
                      ? 'url'
                      : kind === 'number' || kind === 'money'
                        ? 'number'
                        : kind === 'date'
                          ? 'date'
                          : 'text'
              }
              value={value}
              disabled={disabled}
              onChange={(event) => onChange(event.target.value)}
              placeholder={placeholder}
              className="h-9"
            />
          )}
        </div>
      </div>
    </div>
  )
}
