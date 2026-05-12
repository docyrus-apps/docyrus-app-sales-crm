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
        'group rounded-2xl border border-border/70 bg-linear-to-br from-card via-card to-muted/[0.16] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition-colors',
        required && 'border-rose-200/80 dark:border-rose-900/40',
        highlight &&
          'border-primary/35 bg-linear-to-br from-primary/[0.03] via-card to-sky-500/[0.035]',
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
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
          'grid items-center gap-2',
          hasSourceValue
            ? 'grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.3fr)]'
            : 'grid-cols-1',
        )}
      >
        {hasSourceValue ? (
          <>
            <div className="min-w-0 rounded-xl border border-sky-200/70 bg-sky-50/75 px-3 py-2 text-xs dark:border-sky-900/50 dark:bg-sky-950/20">
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
            </div>
            <ArrowRight
              className="hidden size-3.5 text-muted-foreground/60 sm:block"
              aria-hidden
            />
          </>
        ) : null}
        <div className="min-w-0 rounded-xl border border-emerald-200/70 bg-emerald-50/70 p-2.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          {kind === 'textarea' ? (
            <Textarea
              value={value}
              disabled={disabled}
              onChange={(event) => onChange(event.target.value)}
              placeholder={placeholder}
              rows={3}
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
