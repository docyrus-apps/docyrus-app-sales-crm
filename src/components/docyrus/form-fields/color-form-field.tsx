'use client'

import { useMemo, useState } from 'react'

import { cn } from '@/lib/utils'
import { Field, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { TAILWIND_COLOR_FAMILIES, resolveColorHex } from '@/lib/tailwind-colors'

import { useUiTranslation } from '@/lib/use-ui-translation'

import { FormFieldLabel } from './form-field-label'
import { type DocyrusFormFieldProps } from './types'

const DEFAULT_TONES = [500]

export function ColorFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
  tones,
}: DocyrusFormFieldProps) {
  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid
        const colorValue: string = field.state.value ?? ''
        const isDisabled = disabled || fieldConfig.readOnly === true

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FormFieldLabel htmlFor={field.name} required={required}>
              {fieldConfig.name}
            </FormFieldLabel>
            <ColorPicker
              value={colorValue}
              disabled={isDisabled}
              tones={tones}
              onChange={(val) => {
                field.handleChange(val)
              }}
              onBlur={field.handleBlur}
              fieldName={field.name}
            />
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    />
  )
}

interface ColorPickerProps {
  value: string
  disabled?: boolean
  tones?: number[]
  onChange: (value: string) => void
  onBlur: () => void
  fieldName: string
}

function ColorPicker({
  value,
  disabled,
  tones,
  onChange,
  onBlur,
  fieldName,
}: ColorPickerProps) {
  const { t } = useUiTranslation()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('tailwind')
  const resolvedTones = tones && tones.length > 0 ? tones : DEFAULT_TONES

  const paletteColors = useMemo(
    () =>
      TAILWIND_COLOR_FAMILIES.flatMap((name) =>
        resolvedTones.map((tone) => `${name}-${tone}`),
      ),
    [resolvedTones],
  )

  const isTailwindColor = useMemo(
    () => (value ? paletteColors.includes(value) : false),
    [value, paletteColors],
  )

  const resolvedBg = value
    ? isTailwindColor
      ? resolveColorHex(value)
      : value
    : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            'flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm',
            'hover:bg-accent/50 transition-colors',
            disabled && 'pointer-events-none opacity-50',
            !value && 'text-muted-foreground',
          )}
        >
          <span
            className={cn(
              'size-4 shrink-0 rounded-sm border border-border',
              !value && 'bg-muted',
            )}
            style={resolvedBg ? { backgroundColor: resolvedBg } : undefined}
          />
          <span className="truncate text-left flex-1">
            {value || t('ui.formField.colorSelectPlaceholder', 'Select color')}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-72 p-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-8 w-full">
            <TabsTrigger value="tailwind" className="flex-1 text-xs">
              {t('ui.formField.colorPaletteTab', 'Palette')}
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex-1 text-xs">
              {t('ui.formField.colorCustomTab', 'Custom')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tailwind" className="mt-2">
            <TailwindPalette
              tones={resolvedTones}
              value={value}
              disabled={disabled}
              onChange={onChange}
            />
          </TabsContent>

          <TabsContent value="custom" className="mt-2">
            <div className="flex gap-2">
              <input
                type="color"
                value={value && value.startsWith('#') ? value : '#000000'}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                disabled={disabled}
                className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-input p-1"
              />
              <Input
                id={fieldName}
                name={fieldName}
                value={value}
                onBlur={onBlur}
                onChange={(e) => onChange(e.target.value)}
                placeholder={t('ui.formField.colorHexPlaceholder', '#000000')}
                disabled={disabled}
                className="flex-1"
              />
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}

interface TailwindPaletteProps {
  tones: number[]
  value: string
  disabled?: boolean
  onChange: (value: string) => void
}

function TailwindPalette({
  tones,
  value,
  disabled,
  onChange,
}: TailwindPaletteProps) {
  return (
    <div className="max-h-55 overflow-y-auto p-1">
      {tones.map((tone) => (
        <div key={tone} className="mb-2">
          {tones.length > 1 && (
            <p className="mb-1 text-[10px] text-muted-foreground">{tone}</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {TAILWIND_COLOR_FAMILIES.map((family) => {
              const colorKey = `${family}-${tone}`
              const isSelected = value === colorKey

              return (
                <button
                  key={colorKey}
                  type="button"
                  aria-label={colorKey}
                  title={colorKey}
                  disabled={disabled}
                  className={cn(
                    'size-6 shrink-0 rounded-sm transition-transform',
                    isSelected
                      ? 'scale-110 ring-2 ring-primary ring-offset-1 ring-offset-background'
                      : 'hover:scale-105',
                  )}
                  style={{ backgroundColor: resolveColorHex(colorKey) }}
                  onClick={() => onChange(colorKey)}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
