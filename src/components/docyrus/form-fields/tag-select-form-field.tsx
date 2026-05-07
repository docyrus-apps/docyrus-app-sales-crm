'use client'

import { useState } from 'react'

import { Check, ChevronsUpDown, X } from 'lucide-react'

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { Field, FieldError } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { cn } from '@/lib/utils'

import { useUiTranslation } from '@/lib/use-ui-translation'

import { FormFieldLabel } from './form-field-label'
import { type DocyrusFormFieldProps } from './types'

export function TagSelectFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
  enumOptions = [],
}: DocyrusFormFieldProps) {
  const { t } = useUiTranslation()

  const [open, setOpen] = useState(false)

  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid
        const selected: Array<string> = Array.isArray(field.state.value)
          ? field.state.value
          : []

        const toggleOption = (optionId: string) => {
          const next = selected.includes(optionId)
            ? selected.filter((id) => id !== optionId)
            : [...selected, optionId]

          field.handleChange(next)
        }

        const removeOption = (optionId: string) => {
          field.handleChange(selected.filter((id) => id !== optionId))
        }

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
                  className="h-auto min-h-9 w-full justify-between"
                >
                  <span className="flex flex-wrap gap-1">
                    {selected.length === 0 && (
                      <span className="text-muted-foreground">
                        {t(
                          'ui.formField.tagSelectPlaceholder',
                          'Select tags...',
                        )}
                      </span>
                    )}
                    {selected.map((id) => {
                      const opt = enumOptions.find((o) => o.id === id)

                      if (!opt) return null

                      return (
                        <Badge key={id} variant="outline" className="gap-1">
                          {opt.icon ? (
                            <DocyrusIcon
                              icon={opt.icon}
                              className="size-3.5 shrink-0"
                            />
                          ) : opt.color ? (
                            <span
                              className="size-2 shrink-0 rounded-full"
                              style={{ backgroundColor: opt.color }}
                            />
                          ) : null}
                          {opt.name}
                          <span
                            role="button"
                            tabIndex={-1}
                            className="ml-0.5 cursor-pointer rounded-full outline-none hover:opacity-70"
                            onPointerDown={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              removeOption(id)
                            }}
                          >
                            <X className="size-3" />
                          </span>
                        </Badge>
                      )
                    })}
                  </span>
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                <Command>
                  <CommandInput
                    placeholder={t(
                      'ui.formField.tagSearchPlaceholder',
                      'Search tags...',
                    )}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {t('ui.formField.tagNoTagsFound', 'No tags found.')}
                    </CommandEmpty>
                    <CommandGroup>
                      {enumOptions.map((option) => (
                        <CommandItem
                          key={option.id}
                          value={option.name}
                          onSelect={() => toggleOption(option.id)}
                        >
                          <Check
                            className={cn(
                              'mr-2 size-4',
                              selected.includes(option.id)
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                          {option.icon ? (
                            <DocyrusIcon
                              icon={option.icon}
                              className="mr-1.5 size-4 shrink-0"
                            />
                          ) : option.color ? (
                            <span
                              className="mr-1.5 size-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: option.color }}
                            />
                          ) : null}
                          {option.name}
                        </CommandItem>
                      ))}
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
