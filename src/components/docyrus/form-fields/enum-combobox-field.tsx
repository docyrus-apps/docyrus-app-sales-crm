'use client'

import { useMemo, useState } from 'react'

import { Check, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Field, FieldError } from '@/components/ui/field'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

import { useUiTranslation } from '@/lib/use-ui-translation'

import { FormFieldLabel } from './form-field-label'
import { EnumOptionDisplay } from './lib/enum-option-display'
import { flattenNestedOptions } from './lib/utils'
import { type DocyrusFormFieldProps, type EnumOption } from './types'

/**
 * Searchable single-select dropdown for enum / select fields.
 *
 * Replaces the plain Radix `<Select>` so that — per the detail-page design —
 * every non-status single-select (and relation) reads as the same clean,
 * searchable, "Location-style" combobox: trigger that mirrors the value,
 * cmdk search, options rendered via `EnumOptionDisplay` (plain text unless the
 * option carries both an icon and a colour). Status keeps its coloured chip
 * via `StatusFormField`; this component is intentionally chip-free.
 */
export function EnumComboboxField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
  enumOptions = [],
}: DocyrusFormFieldProps) {
  const { t } = useUiTranslation()
  const [open, setOpen] = useState(false)

  const isNested = fieldConfig.nested === true
  const nestedByProp = fieldConfig.nestedByProp ?? 'parent'

  const flatOptions = useMemo(
    () => (isNested ? flattenNestedOptions(enumOptions, nestedByProp) : null),
    [enumOptions, isNested, nestedByProp],
  )

  const renderItems = (
    items: Array<{ option: EnumOption; depth: number }>,
    currentValue: string,
    onPick: (id: string | null) => void,
  ) =>
    items.map(({ option, depth }) => (
      <CommandItem
        key={option.id}
        value={`${option.name} ${option.id}`}
        onSelect={() => {
          onPick(option.id === currentValue ? null : option.id)
          setOpen(false)
        }}
      >
        <Check
          className={cn(
            'mr-2 size-4 shrink-0',
            currentValue === option.id ? 'opacity-100' : 'opacity-0',
          )}
        />
        <span
          className="min-w-0 flex-1"
          style={depth > 0 ? { paddingLeft: `${depth * 1}rem` } : undefined}
        >
          <EnumOptionDisplay option={option} variant="inline" />
        </span>
      </CommandItem>
    ))

  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid
        const currentValue = field.state.value ?? ''
        const selectedOption = enumOptions.find((o) => o.id === currentValue)

        const items = flatOptions
          ? flatOptions
          : enumOptions.map((option) => ({ option, depth: 0 }))

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FormFieldLabel htmlFor={field.name} required={required}>
              {fieldConfig.name}
            </FormFieldLabel>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  id={field.name}
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  aria-invalid={isInvalid}
                  onBlur={field.handleBlur}
                  disabled={disabled || fieldConfig.readOnly === true}
                  className="h-auto min-h-9 w-full justify-between font-normal"
                >
                  {selectedOption ? (
                    <span className="min-w-0 truncate">
                      <EnumOptionDisplay
                        option={selectedOption}
                        variant="inline"
                      />
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {t('ui.formField.selectPlaceholder', 'Select...')}
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) min-w-[18rem] max-h-[min(360px,var(--radix-popover-content-available-height))] p-0">
                <Command>
                  <CommandInput
                    placeholder={t(
                      'ui.formField.searchPlaceholder',
                      'Search...',
                    )}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {t('ui.formField.noResults', 'No results found.')}
                    </CommandEmpty>
                    <CommandGroup>
                      {renderItems(items, currentValue, field.handleChange)}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    />
  )
}
