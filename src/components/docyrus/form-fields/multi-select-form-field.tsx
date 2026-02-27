'use client';

import { useState } from 'react';

import { Check, ChevronsUpDown, X } from 'lucide-react';

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

import {
  getEnumBadgeColors, getEnumDotClassName, getEnumDotStyle, getEnumIconColor
} from './lib/utils';
import { type DocyrusFormFieldProps } from './types';

export function MultiSelectFormField({
  field: fieldConfig,
  form,
  disabled,
  className,
  enumOptions = []
}: DocyrusFormFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => {
        const isInvalid
          = field.state.meta.isTouched && !field.state.meta.isValid;
        const selected: Array<string> = Array.isArray(field.state.value)
          ? field.state.value
          : [];

        const toggleOption = (optionId: string) => {
          const next = selected.includes(optionId)
            ? selected.filter(id => id !== optionId)
            : [...selected, optionId];

          field.handleChange(next);
        };

        const removeOption = (optionId: string) => {
          field.handleChange(selected.filter(id => id !== optionId));
        };

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
                  className="h-auto min-h-9 w-full justify-between">
                  <span className="flex flex-wrap gap-1">
                    {selected.length === 0 && (
                      <span className="text-muted-foreground">Select...</span>
                    )}
                    {selected.map((id) => {
                      const opt = enumOptions.find(o => o.id === id);

                      if (!opt) return null;
                      const colors = getEnumBadgeColors(opt.color);

                      return (
                        <Badge
                          key={id}
                          variant="secondary"
                          className={cn('gap-1', colors.className)}
                          style={colors.style}>
                          {opt.icon ? (
                            <DocyrusIcon
                              icon={opt.icon}
                              className="size-3.5 shrink-0" />
                          ) : opt.color ? (
                            <span
                              className={cn(
                                'size-2 shrink-0 rounded-full',
                                getEnumDotClassName(opt.color)
                              )}
                              style={getEnumDotStyle(opt.color)} />
                          ) : null}
                          {opt.name}
                          <span
                            role="button"
                            tabIndex={-1}
                            className="ml-0.5 cursor-pointer rounded-full outline-none hover:opacity-70"
                            onPointerDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeOption(id);
                            }}>
                            <X className="size-3" />
                          </span>
                        </Badge>
                      );
                    })}
                  </span>
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                <Command>
                  <CommandInput placeholder="Search..." />
                  <CommandList>
                    <CommandEmpty>No options found.</CommandEmpty>
                    <CommandGroup>
                      {enumOptions.map((option) => {
                        const iconColor = getEnumIconColor(option.color);

                        return (
                          <CommandItem
                            key={option.id}
                            value={option.name}
                            onSelect={() => toggleOption(option.id)}>
                            <Check
                              className={cn(
                                'mr-2 size-4',
                                selected.includes(option.id)
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )} />
                            {option.icon ? (
                              <span
                                className={cn('mr-1.5', iconColor.className)}
                                style={iconColor.style}>
                                <DocyrusIcon
                                  icon={option.icon}
                                  className="size-4 shrink-0" />
                              </span>
                            ) : option.color ? (
                              <span
                                className={cn(
                                  'mr-1.5 size-2.5 shrink-0 rounded-full',
                                  getEnumDotClassName(option.color)
                                )}
                                style={getEnumDotStyle(option.color)} />
                            ) : null}
                            {option.name}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }} />
  );
}