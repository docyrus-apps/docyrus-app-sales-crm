'use client';

import { Star } from 'lucide-react';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { type DocyrusFormFieldProps } from './types';

export function RatingFormField({
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
        const currentValue
          = typeof field.state.value === 'number' ? field.state.value : 0;
        const isDisabled = disabled || fieldConfig.readOnly === true;

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FieldLabel>{fieldConfig.name}</FieldLabel>
            <div
              className="flex gap-1"
              role="radiogroup"
              aria-label={fieldConfig.name}
              aria-invalid={isInvalid}>
              {[
                1,
                2,
                3,
                4,
                5
              ].map(star => (
                <Button
                  key={star}
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isDisabled}
                  onClick={() => {
                    field.handleChange(star === currentValue ? 0 : star);
                  }}
                  onBlur={field.handleBlur}
                  className={cn(
                    'size-7 rounded p-0.5',
                    isDisabled && 'cursor-not-allowed opacity-50'
                  )}
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}>
                  <Star
                    className={cn(
                      'size-5',
                      star <= currentValue ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                    )} />
                </Button>
              ))}
            </div>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }} />
  );
}