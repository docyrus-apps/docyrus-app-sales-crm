'use client';

import { useMemo } from 'react';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';

import {
  RadioGroup, type RadioGroupOption
} from '@/components/docyrus/radio-group';

import { type DocyrusFormFieldProps } from './types';

export function RadioGroupFormField({
  field: fieldConfig,
  form,
  disabled,
  className,
  enumOptions = []
}: DocyrusFormFieldProps) {
  const options: RadioGroupOption[] = useMemo(
    () => enumOptions.map(o => ({
      value: o.id,
      label: o.name,
      description: o.description,
      icon: o.icon,
      color: o.color
    })),
    [enumOptions]
  );

  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => {
        const isInvalid
          = field.state.meta.isTouched && !field.state.meta.isValid;

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FieldLabel>{fieldConfig.name}</FieldLabel>
            <RadioGroup
              value={field.state.value ?? ''}
              onValueChange={field.handleChange}
              disabled={disabled || fieldConfig.readOnly === true}
              aria-invalid={isInvalid}
              options={options} />
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }} />
  );
}