'use client';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import { type DocyrusFormFieldProps } from './types';

export function PercentFormField({
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
            <div className="relative">
              <Input
                id={field.name}
                name={field.name}
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={field.state.value ?? ''}
                onBlur={field.handleBlur}
                onChange={(e) => {
                  const val = e.target.value;

                  field.handleChange(val === '' ? null : Number(val));
                }}
                aria-invalid={isInvalid}
                disabled={disabled || fieldConfig.readOnly === true}
                className="pr-8" />
              <span className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                %
              </span>
            </div>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }} />
  );
}