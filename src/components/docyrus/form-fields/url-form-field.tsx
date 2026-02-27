'use client';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import { type DocyrusFormFieldProps } from './types';

export function UrlFormField({
  field: fieldConfig,
  form,
  disabled,
  className
}: DocyrusFormFieldProps) {
  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => {
        const isInvalid
          = field.state.meta.isTouched && !field.state.meta.isValid;

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FieldLabel htmlFor={field.name}>{fieldConfig.name}</FieldLabel>
            <Input
              id={field.name}
              name={field.name}
              type="url"
              placeholder="https://"
              value={field.state.value ?? ''}
              onBlur={field.handleBlur}
              onChange={e => field.handleChange(e.target.value)}
              aria-invalid={isInvalid}
              disabled={disabled || fieldConfig.readOnly === true} />
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }} />
  );
}