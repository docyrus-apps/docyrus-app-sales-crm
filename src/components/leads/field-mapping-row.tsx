import { ArrowRight, X } from 'lucide-react'
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
  onRemove,
  highlight,
  required,
  fieldKey,
}: FieldMappingRowProps) {
  const sourceDisplay = sourceValue?.trim() ? sourceValue : '—'

  return (
    <div
      data-field-key={fieldKey}
      className={cn(
        'group rounded-lg border bg-card p-3 transition-colors',
        highlight && 'border-primary/40 bg-primary/[0.03]',
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <Label className="text-xs font-medium">
          {label}
          {required ? (
            <span className="ml-0.5 text-destructive" aria-label="zorunlu">
              *
            </span>
          ) : null}
        </Label>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="rounded p-0.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 disabled:cursor-not-allowed"
            aria-label="Alanı kaldır"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1.4fr)] items-center gap-2">
        <div className="flex h-9 min-w-0 items-center rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 px-2.5 text-xs text-muted-foreground">
          <span className="truncate" title={sourceDisplay}>
            {sourceDisplay}
          </span>
        </div>
        <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
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
            <Select
              value={value}
              disabled={disabled}
              onValueChange={onChange}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={placeholder ?? 'Seçin...'} />
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
        <span>{sourceLabel ?? 'Yok'}</span>
        <span className="mx-1.5">→</span>
        <span>{targetLabel}</span>
      </p>
    </div>
  )
}
