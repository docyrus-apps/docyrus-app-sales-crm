'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

interface FieldRowProps {
  label: string
  helpText?: string
  children: ReactNode
  className?: string
}

export function FieldRow({
  label,
  helpText,
  children,
  className,
}: FieldRowProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      {children}
      {helpText ? (
        <p className="text-[10px] text-muted-foreground/80">{helpText}</p>
      ) : null}
    </div>
  )
}

interface FieldInlineProps {
  label: string
  helpText?: string
  children: ReactNode
  className?: string
}

export function FieldInline({
  label,
  helpText,
  children,
  className,
}: FieldInlineProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label className="text-[11px] text-muted-foreground">{label}</Label>
        {children}
      </div>
      {helpText ? (
        <p className="text-[10px] text-muted-foreground/80">{helpText}</p>
      ) : null}
    </div>
  )
}

/* ─── Text field ────────────────────────────────────────────── */

interface TextFieldProps {
  label: string
  value: string | undefined
  placeholder?: string
  helpText?: string
  onChange: (next: string | undefined) => void
  multiline?: boolean
}

export function TextField({
  label,
  value,
  placeholder,
  helpText,
  onChange,
  multiline,
}: TextFieldProps) {
  return (
    <FieldRow label={label} helpText={helpText}>
      {multiline ? (
        <Textarea
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(event) =>
            onChange(event.target.value === '' ? undefined : event.target.value)
          }
          className="min-h-[60px] text-xs"
        />
      ) : (
        <Input
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(event) =>
            onChange(event.target.value === '' ? undefined : event.target.value)
          }
          className="h-7 text-xs"
        />
      )}
    </FieldRow>
  )
}

/* ─── Number field ──────────────────────────────────────────── */

interface NumberFieldProps {
  label: string
  value: number | undefined
  placeholder?: string
  helpText?: string
  min?: number
  max?: number
  step?: number
  onChange: (next: number | undefined) => void
}

export function NumberField({
  label,
  value,
  placeholder,
  helpText,
  min,
  max,
  step,
  onChange,
}: NumberFieldProps) {
  return (
    <FieldRow label={label} helpText={helpText}>
      <Input
        type="number"
        value={value ?? ''}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const raw = event.target.value

          onChange(raw === '' ? undefined : Number(raw))
        }}
        className="h-7 text-xs"
      />
    </FieldRow>
  )
}

/* ─── Boolean switch ────────────────────────────────────────── */

interface BooleanSwitchProps {
  label: string
  value: boolean | undefined
  defaultValue?: boolean
  helpText?: string
  onChange: (next: boolean | undefined) => void
}

export function BooleanSwitch({
  label,
  value,
  defaultValue,
  helpText,
  onChange,
}: BooleanSwitchProps) {
  const effective = value ?? defaultValue ?? false

  return (
    <FieldInline label={label} helpText={helpText}>
      <Switch
        checked={effective}
        onCheckedChange={(next) => {
          if (defaultValue !== undefined && next === defaultValue) {
            onChange(undefined)

            return
          }

          onChange(next)
        }}
      />
    </FieldInline>
  )
}

/* ─── Enum select ───────────────────────────────────────────── */

export interface EnumOption<T extends string = string> {
  value: T
  label: string
}

interface EnumSelectProps<T extends string> {
  label: string
  value: T | undefined
  options: ReadonlyArray<EnumOption<T>>
  helpText?: string
  placeholder?: string
  /** When defined and selected, the value is cleared (set to undefined). */
  defaultValue?: T
  /** Show a "(default)" placeholder explicitly clearable item. Defaults to true. */
  allowClear?: boolean
  onChange: (next: T | undefined) => void
}

const CLEAR_TOKEN = '__clear__'

export function EnumSelect<T extends string>({
  label,
  value,
  options,
  helpText,
  placeholder,
  defaultValue,
  allowClear = true,
  onChange,
}: EnumSelectProps<T>) {
  const effective: string = value ?? ''

  return (
    <FieldRow label={label} helpText={helpText}>
      <Select
        value={effective}
        onValueChange={(next) => {
          if (next === CLEAR_TOKEN || next === '') {
            onChange(undefined)

            return
          }

          if (defaultValue !== undefined && next === defaultValue) {
            onChange(undefined)

            return
          }

          onChange(next as T)
        }}
      >
        <SelectTrigger className="h-7 text-xs" size="sm">
          <SelectValue placeholder={placeholder ?? defaultValue ?? '—'} />
        </SelectTrigger>
        <SelectContent>
          {allowClear ? (
            <SelectItem
              value={CLEAR_TOKEN}
              className="text-xs text-muted-foreground"
            >
              {defaultValue ? `Default (${defaultValue})` : '— Not set —'}
            </SelectItem>
          ) : null}
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldRow>
  )
}
