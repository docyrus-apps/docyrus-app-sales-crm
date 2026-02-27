'use client';

import { FileIcon } from 'lucide-react';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import { type DocyrusFormFieldProps } from './types';

export function FileFormField({
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
        const currentValue = field.state.value as
          | { name?: string; signed_url?: string }
          | string
          | null;

        const fileName
          = typeof currentValue === 'object' && currentValue?.name
            ? currentValue.name
            : typeof currentValue === 'string'
              ? currentValue
              : null;

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FieldLabel htmlFor={field.name}>{fieldConfig.name}</FieldLabel>
            {fileName && (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <FileIcon className="size-4" />
                <span className="truncate">{fileName}</span>
              </div>
            )}
            <Input
              id={field.name}
              name={field.name}
              type="file"
              onBlur={field.handleBlur}
              onChange={(e) => {
                const file = e.target.files?.[0];

                field.handleChange(file ?? null);
              }}
              aria-invalid={isInvalid}
              disabled={disabled || fieldConfig.readOnly === true} />
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }} />
  );
}