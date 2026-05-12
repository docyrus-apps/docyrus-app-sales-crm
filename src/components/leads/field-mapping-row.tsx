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
  sourceLabel,
  targetLabel,
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
        'group rounded-lg border bg-card p-3 transition-colors',
        required && 'border-primary/25 bg-primary/[0.02]',
        highlight && 'border-primary/40 bg-primary/[0.03]',
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Label className="truncate text-xs font-medium">{label}</Label>
          {required ? (
            <span className="rounded border border-destructive/25 bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
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
            ? 'grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.4fr)]'
            : 'grid-cols-1',
        )}
      >
        {hasSourceValue ? (
          <>
            <div className="flex h-9 min-w-0 items-center gap-1 rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 px-2.5 text-xs text-muted-foreground">
              <span className="truncate" title={sourceDisplay}>
                {sourceDisplay}
              </span>
              {canRestoreSource ? (
                <button
                  type="button"
                  onClick={onRestoreSource}
                  className="ml-auto rounded p-0.5 text-muted-foreground opacity-0 transition hover:bg-background hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
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
            <ArrowRight
              className="hidden size-3.5 text-muted-foreground sm:block"
              aria-hidden
            />
          </>
        ) : null}
        <div className="min-w-0">
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
      <p className="mt-2 text-[10.5px] uppercase tracking-wide text-muted-foreground/80">
        {hasSourceValue ? (
          <>
            <span>{sourceLabel ?? t('common.na')}</span>
            <span className="mx-1.5">→</span>
          </>
        ) : null}
        <span>{targetLabel}</span>
      </p>
    </div>
  )
}
