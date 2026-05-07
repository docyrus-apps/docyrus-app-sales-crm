'use client'

import { useMemo, useState } from 'react'

import { ChevronsLeft, ChevronsRight } from 'lucide-react'

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { Field, FieldError } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

import { useUiTranslation } from '@/lib/use-ui-translation'

import { FormFieldLabel } from './form-field-label'
import {
  getEnumDotClassName,
  getEnumDotStyle,
  getEnumIconColor,
} from './lib/utils'
import { type DocyrusFormFieldProps } from './types'

export function MultiSelectFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
  enumOptions = [],
}: DocyrusFormFieldProps) {
  const { t } = useUiTranslation()

  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => (
        <MultiSelectFieldInner
          field={field}
          fieldConfig={fieldConfig}
          disabled={disabled}
          required={required}
          className={className}
          enumOptions={enumOptions}
          t={t}
        />
      )}
    />
  )
}

function MultiSelectFieldInner({
  field,
  fieldConfig,
  disabled,
  required,
  className,
  enumOptions = [],
  t,
}: {
  field: any
  fieldConfig: DocyrusFormFieldProps['field']
  disabled?: boolean
  required?: boolean
  className?: string
  enumOptions?: DocyrusFormFieldProps['enumOptions']
  t: (key: string, fallback: string) => string
}) {
  const [checkedAvailable, setCheckedAvailable] = useState<Set<string>>(
    new Set(),
  )
  const [checkedSelected, setCheckedSelected] = useState<Set<string>>(new Set())
  const [searchAvailable, setSearchAvailable] = useState('')
  const [searchSelected, setSearchSelected] = useState('')

  const isDisabled = disabled || fieldConfig.readOnly === true
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const selected: Array<string> = useMemo(
    () => (Array.isArray(field.state.value) ? field.state.value : []),
    [field.state.value],
  )
  const selectedSet = useMemo(() => new Set(selected), [selected])

  const availableOptions = useMemo(
    () => enumOptions.filter((o) => !selectedSet.has(o.id)),
    [enumOptions, selectedSet],
  )

  const selectedOptions = useMemo(
    () => enumOptions.filter((o) => selectedSet.has(o.id)),
    [enumOptions, selectedSet],
  )

  const filteredAvailable = useMemo(() => {
    if (!searchAvailable) return availableOptions
    const q = searchAvailable.toLowerCase()

    return availableOptions.filter((o) => o.name.toLowerCase().includes(q))
  }, [availableOptions, searchAvailable])

  const filteredSelected = useMemo(() => {
    if (!searchSelected) return selectedOptions
    const q = searchSelected.toLowerCase()

    return selectedOptions.filter((o) => o.name.toLowerCase().includes(q))
  }, [selectedOptions, searchSelected])

  const moveToSelected = () => {
    if (checkedAvailable.size === 0) return
    field.handleChange([...selected, ...checkedAvailable])
    setCheckedAvailable(new Set())
  }

  const moveToAvailable = () => {
    if (checkedSelected.size === 0) return
    field.handleChange(
      selected.filter((id: string) => !checkedSelected.has(id)),
    )
    setCheckedSelected(new Set())
  }

  const selectAllAvailable = () => {
    setCheckedAvailable(new Set(filteredAvailable.map((o) => o.id)))
  }

  const deselectAllAvailable = () => {
    setCheckedAvailable(new Set())
  }

  const selectAllSelected = () => {
    setCheckedSelected(new Set(filteredSelected.map((o) => o.id)))
  }

  const deselectAllSelected = () => {
    setCheckedSelected(new Set())
  }

  const toggleAvailableCheck = (id: string) => {
    setCheckedAvailable((prev) => {
      const next = new Set(prev)

      if (next.has(id)) next.delete(id)
      else next.add(id)

      return next
    })
  }

  const toggleSelectedCheck = (id: string) => {
    setCheckedSelected((prev) => {
      const next = new Set(prev)

      if (next.has(id)) next.delete(id)
      else next.add(id)

      return next
    })
  }

  return (
    <Field data-invalid={isInvalid} className={className}>
      <FormFieldLabel htmlFor={field.name} required={required}>
        {fieldConfig.name}
      </FormFieldLabel>
      <div className="flex items-stretch gap-2">
        {/* Available panel */}
        <div className="bg-background border-input flex min-h-50 flex-1 flex-col overflow-hidden rounded-md border">
          <div className="border-b px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t('ui.megaSelect.available', 'Available')} (
                {availableOptions.length})
              </span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-xs"
                  disabled={isDisabled || filteredAvailable.length === 0}
                  onClick={
                    checkedAvailable.size === filteredAvailable.length &&
                    filteredAvailable.length > 0
                      ? deselectAllAvailable
                      : selectAllAvailable
                  }
                >
                  {checkedAvailable.size === filteredAvailable.length &&
                  filteredAvailable.length > 0
                    ? t('ui.megaSelect.deselectAll', 'Deselect all')
                    : t('ui.megaSelect.selectAll', 'Select all')}
                </Button>
              </div>
            </div>
            {enumOptions.length > 6 && (
              <Input
                placeholder={t('ui.common.searchPlaceholder', 'Search...')}
                value={searchAvailable}
                onChange={(e) => setSearchAvailable(e.target.value)}
                className="mt-1.5 h-7 text-xs"
                disabled={isDisabled}
              />
            )}
          </div>
          <ScrollArea className="flex-1">
            <div className="p-1">
              {filteredAvailable.length === 0 ? (
                <p className="text-muted-foreground px-2 py-3 text-center text-xs">
                  {t('ui.megaSelect.noItems', 'No items')}
                </p>
              ) : (
                filteredAvailable.map((option) => (
                  <OptionRow
                    key={option.id}
                    option={option}
                    checked={checkedAvailable.has(option.id)}
                    disabled={isDisabled}
                    onToggle={() => toggleAvailableCheck(option.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Transfer buttons */}
        <div className="flex flex-col items-center justify-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            disabled={isDisabled || checkedAvailable.size === 0}
            onClick={moveToSelected}
            aria-label={t('ui.megaSelect.moveRight', 'Move selected right')}
          >
            <ChevronsRight className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            disabled={isDisabled || checkedSelected.size === 0}
            onClick={moveToAvailable}
            aria-label={t('ui.megaSelect.moveLeft', 'Move selected left')}
          >
            <ChevronsLeft className="size-4" />
          </Button>
        </div>

        {/* Selected panel */}
        <div className="bg-background border-input flex min-h-50 flex-1 flex-col overflow-hidden rounded-md border">
          <div className="border-b px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t('ui.megaSelect.selected', 'Selected')} (
                {selectedOptions.length})
              </span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-xs"
                  disabled={isDisabled || filteredSelected.length === 0}
                  onClick={
                    checkedSelected.size === filteredSelected.length &&
                    filteredSelected.length > 0
                      ? deselectAllSelected
                      : selectAllSelected
                  }
                >
                  {checkedSelected.size === filteredSelected.length &&
                  filteredSelected.length > 0
                    ? t('ui.megaSelect.deselectAll', 'Deselect all')
                    : t('ui.megaSelect.selectAll', 'Select all')}
                </Button>
              </div>
            </div>
            {enumOptions.length > 6 && (
              <Input
                placeholder={t('ui.common.searchPlaceholder', 'Search...')}
                value={searchSelected}
                onChange={(e) => setSearchSelected(e.target.value)}
                className="mt-1.5 h-7 text-xs"
                disabled={isDisabled}
              />
            )}
          </div>
          <ScrollArea className="flex-1">
            <div className="p-1">
              {filteredSelected.length === 0 ? (
                <p className="text-muted-foreground px-2 py-3 text-center text-xs">
                  {t('ui.megaSelect.noItems', 'No items')}
                </p>
              ) : (
                filteredSelected.map((option) => (
                  <OptionRow
                    key={option.id}
                    option={option}
                    checked={checkedSelected.has(option.id)}
                    disabled={isDisabled}
                    onToggle={() => toggleSelectedCheck(option.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}

function OptionRow({
  option,
  checked,
  disabled,
  onToggle,
}: {
  option: {
    id: string
    name: string
    icon?: string
    color?: string
  }
  checked: boolean
  disabled: boolean
  onToggle: () => void
}) {
  const iconColor = getEnumIconColor(option.color)

  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
        'hover:bg-accent hover:text-accent-foreground',
        'select-none transition-colors',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        disabled={disabled}
      />
      {option.icon ? (
        <span
          className={cn('shrink-0', iconColor.className)}
          style={iconColor.style}
        >
          <DocyrusIcon icon={option.icon} className="size-4 shrink-0" />
        </span>
      ) : option.color ? (
        <span
          className={cn(
            'size-2.5 shrink-0 rounded-full',
            getEnumDotClassName(option.color),
          )}
          style={getEnumDotStyle(option.color)}
        />
      ) : null}
      <span className="truncate">{option.name}</span>
    </label>
  )
}
