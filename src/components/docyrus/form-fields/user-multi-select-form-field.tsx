'use client'

import { useState } from 'react'

import { Check, ChevronsUpDown, X } from 'lucide-react'

import { Field, FieldError } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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

export function UserMultiSelectFormField({
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

        const toggleUser = (userId: string) => {
          const next = selected.includes(userId)
            ? selected.filter((id) => id !== userId)
            : [...selected, userId]

          field.handleChange(next)
        }

        const removeUser = (userId: string) => {
          field.handleChange(selected.filter((id) => id !== userId))
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
                          'ui.formField.userMultiSelectPlaceholder',
                          'Select users...',
                        )}
                      </span>
                    )}
                    {selected.map((id) => {
                      const user = enumOptions.find((o) => o.id === id)

                      if (!user) return null

                      return (
                        <Badge key={id} variant="secondary" className="gap-1">
                          <Avatar size="sm" className="size-4">
                            <AvatarImage src={user.icon} />
                            <AvatarFallback className="text-[8px]">
                              {user.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          {user.name}
                          <span
                            role="button"
                            tabIndex={-1}
                            className="ml-0.5 cursor-pointer rounded-full outline-none hover:opacity-70"
                            onPointerDown={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              removeUser(id)
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
              <PopoverContent className="w-(--radix-popover-trigger-width) max-h-(--radix-popover-content-available-height) p-0">
                <Command>
                  <CommandInput
                    placeholder={t(
                      'ui.formField.userSearchPlaceholder',
                      'Search users...',
                    )}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {t('ui.formField.userNoUsersFound', 'No users found.')}
                    </CommandEmpty>
                    <CommandGroup>
                      {enumOptions.map((option) => (
                        <CommandItem
                          key={option.id}
                          value={option.name}
                          onSelect={() => toggleUser(option.id)}
                        >
                          <Check
                            className={cn(
                              'mr-2 size-4',
                              selected.includes(option.id)
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                          <Avatar size="sm" className="mr-2">
                            <AvatarImage src={option.icon} />
                            <AvatarFallback>
                              {option.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
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
