'use client'

import { useState } from 'react'

import { Check, ChevronsUpDown } from 'lucide-react'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
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

import { type DocyrusFormFieldProps } from './types'

export function UserSelectFormField({
  field: fieldConfig,
  form,
  disabled,
  className,
  enumOptions = [],
}: DocyrusFormFieldProps) {
  const [open, setOpen] = useState(false)

  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid
        const currentValue = field.state.value ?? ''
        const selectedUser = enumOptions.find((o) => o.id === currentValue)

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FieldLabel htmlFor={field.name}>{fieldConfig.name}</FieldLabel>
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
                  className="w-full justify-between"
                >
                  {selectedUser ? (
                    <span className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarImage src={selectedUser.icon} />
                        <AvatarFallback>
                          {selectedUser.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      {selectedUser.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Select user...
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                <Command>
                  <CommandInput placeholder="Search users..." />
                  <CommandList>
                    <CommandEmpty>No users found.</CommandEmpty>
                    <CommandGroup>
                      {enumOptions.map((option) => (
                        <CommandItem
                          key={option.id}
                          value={option.name}
                          onSelect={() => {
                            field.handleChange(
                              option.id === currentValue ? null : option.id,
                            )
                            setOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 size-4',
                              currentValue === option.id
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
