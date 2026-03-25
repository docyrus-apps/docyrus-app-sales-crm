'use client';

import { useMemo } from 'react';

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import {
  flattenNestedOptions, getEnumDotClassName, getEnumDotStyle, getEnumIconColor
} from './lib/utils';
import { type DocyrusFormFieldProps, type EnumOption } from './types';

export function SelectFormField({
  field: fieldConfig,
  form,
  disabled,
  className,
  enumOptions = []
}: DocyrusFormFieldProps) {
  const isNested = fieldConfig.nested === true;
  const nestedByProp = fieldConfig.nestedByProp ?? 'parent';

  const flatOptions = useMemo(
    () => isNested ? flattenNestedOptions(enumOptions, nestedByProp) : null,
    [enumOptions, isNested, nestedByProp]
  );

  const renderOption = (option: EnumOption, depth = 0) => {
    const iconColor = getEnumIconColor(option.color);

    return (
      <SelectItem
        key={option.id}
        value={option.id}
        style={depth > 0 ? { paddingLeft: `${0.5 + depth * 1.25}rem` } : undefined}>
        <span className="flex items-center gap-2">
          {option.icon ? (
            <span
              className={iconColor.className}
              style={iconColor.style}>
              <DocyrusIcon
                icon={option.icon}
                className="size-4 shrink-0" />
            </span>
          ) : option.color ? (
            <Badge
              className={cn(
                'size-2.5 shrink-0 rounded-full p-0',
                getEnumDotClassName(option.color)
              )}
              style={getEnumDotStyle(option.color)} />
          ) : null}
          {option.name}
        </span>
      </SelectItem>
    );
  };

  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => {
        const isInvalid
          = field.state.meta.isTouched && !field.state.meta.isValid;

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FieldLabel htmlFor={field.name}>{fieldConfig.name}</FieldLabel>
            <Select
              value={field.state.value ?? ''}
              onValueChange={field.handleChange}
              disabled={disabled || fieldConfig.readOnly === true}>
              <SelectTrigger
                id={field.name}
                aria-invalid={isInvalid}
                onBlur={field.handleBlur}
                className="w-full">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {flatOptions ? flatOptions.map(({ option, depth }) => renderOption(option, depth)) : enumOptions.map(option => renderOption(option))}
              </SelectContent>
            </Select>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }} />
  );
}