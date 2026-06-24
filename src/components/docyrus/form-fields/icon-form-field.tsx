'use client'

// @ts-nocheck
/* eslint-disable */
import { useCallback, useMemo, useState } from 'react'

import { ChevronsUpDownIcon, SearchIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Field, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import {
  allIcons,
  featuredHugeIcons,
  featuredIcons,
  hugeIcons,
} from '@/lib/docyrus/icon-libraries'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

import { FormFieldLabel } from './form-field-label'
import { type DocyrusFormFieldProps } from './types'

type IconLibrary = 'fontawesome' | 'hugeicons'

function getIconLibrary(value: string | null | undefined): IconLibrary {
  if (value?.startsWith('huge ')) return 'hugeicons'

  return 'fontawesome'
}

export function IconFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
}: DocyrusFormFieldProps) {
  return (
    <form.Field name={fieldConfig.slug}>
      {(field: any) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid
        const currentValue: string = field.state.value ?? ''
        const isDisabled = disabled || fieldConfig.readOnly === true

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FormFieldLabel htmlFor={field.name} required={required}>
              {fieldConfig.name}
            </FormFieldLabel>
            <IconPickerPopover
              value={currentValue}
              disabled={isDisabled}
              onChange={(val) => {
                field.handleChange(val)
              }}
              onBlur={field.handleBlur}
            />
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    </form.Field>
  )
}

interface IconPickerPopoverProps {
  value: string
  disabled?: boolean
  onChange: (value: string) => void
  onBlur: () => void
}

function IconPickerPopover({
  value,
  disabled,
  onChange,
  onBlur,
}: IconPickerPopoverProps) {
  const { t } = useUiTranslation()
  const [open, setOpen] = useState(false)
  const [iconSearch, setIconSearch] = useState('')
  const [iconLibrary, setIconLibrary] = useState<IconLibrary>(() =>
    getIconLibrary(value),
  )

  const sourceIcons = iconLibrary === 'hugeicons' ? hugeIcons : allIcons
  const featuredSource =
    iconLibrary === 'hugeicons' ? featuredHugeIcons : featuredIcons

  const visibleIcons = useMemo(() => {
    const query = iconSearch.trim().toLowerCase()

    if (!query) return featuredSource

    return sourceIcons
      .filter((iconItem) => iconItem.toLowerCase().includes(query))
      .slice(0, 120)
  }, [featuredSource, iconSearch, sourceIcons])

  const handleSelect = useCallback(
    (iconValue: string) => {
      onChange(iconValue)
      setOpen(false)
    },
    [onChange],
  )

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) onBlur()
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          {value ? (
            <span
              className="flex items-center gap-2 truncate"
              style={{ stroke: 'currentColor' }}
            >
              <DocyrusIcon icon={value} className="size-4 shrink-0" />
              <span className="truncate text-sm">{value}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">
              {t('ui.formField.iconSelectPlaceholder', 'Select icon...')}
            </span>
          )}
          <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-80 p-3">
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant={iconLibrary === 'fontawesome' ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setIconLibrary('fontawesome')
                setIconSearch('')
              }}
            >
              {t('ui.formField.iconFontAwesome', 'Font Awesome')}
            </Button>
            <Button
              type="button"
              variant={iconLibrary === 'hugeicons' ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setIconLibrary('hugeicons')
                setIconSearch('')
              }}
            >
              {t('ui.formField.iconHugeIcons', 'Huge Icons')}
            </Button>
          </div>

          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={iconSearch}
              onChange={(e) => setIconSearch(e.target.value)}
              placeholder={t(
                'ui.formField.iconSearchPlaceholder',
                'Search icon...',
              )}
              className="h-8 pl-8 text-xs"
            />
          </div>

          <div className="max-h-60 overflow-y-auto p-0.5">
            <div className="grid grid-cols-6 gap-1">
              {visibleIcons.map((iconOption) => {
                const isSelected = value === iconOption

                return (
                  <button
                    key={iconOption}
                    type="button"
                    title={iconOption}
                    className={cn(
                      'flex h-9 w-full items-center justify-center rounded-md text-foreground transition-colors',
                      isSelected
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-accent/60',
                    )}
                    style={{ stroke: 'currentColor' }}
                    onClick={() => handleSelect(iconOption)}
                  >
                    <DocyrusIcon icon={iconOption} className="size-5" />
                  </button>
                )
              })}
            </div>

            {visibleIcons.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">
                {t('ui.formField.iconNoIconsFound', 'No icons found.')}
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
