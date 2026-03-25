'use client';

import { type ChangeEvent } from 'react';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import { type DocyrusFormFieldProps } from './types';

interface NumberFormFieldProps extends DocyrusFormFieldProps {
  /** Allow decimal input */
  decimal?: boolean;
  /** Thousands grouping separator. Defaults to ".". Set to null or undefined to disable grouping. */
  thousandsSeparator?: string | null;
  /** Decimal separator. Defaults to ",". */
  decimalsSeparator?: string;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Strip formatting and return raw numeric string (e.g. "42500" or "42500.99"). */
function cleanNumericInput(
  raw: string,
  decimal: boolean,
  thousandsSep: string | null | undefined,
  decimalSep: string
): string {
  let cleaned = raw;

  if (thousandsSep) {
    cleaned = cleaned.replace(new RegExp(escapeRegex(thousandsSep), 'g'), '');
  }

  if (decimal && decimalSep !== '.') {
    const idx = cleaned.indexOf(decimalSep);

    if (idx !== -1) {
      cleaned = `${cleaned.slice(0, idx)}.${cleaned.slice(idx + decimalSep.length)}`;
    }
  }

  cleaned = cleaned.replace(decimal ? /[^\d.]/g : /\D/g, '');

  if (decimal) {
    const parts = cleaned.split('.');

    if (parts.length > 2) {
      cleaned = `${parts[0]}.${parts.slice(1).join('')}`;
    }
  }

  return cleaned;
}

function formatDisplay(
  raw: string,
  decimal: boolean,
  thousandsSep: string | null | undefined,
  decimalSep: string
): string {
  if (!raw) return '';

  const parts = raw.split('.');
  let intPart = parts[0] ?? '';

  intPart = intPart.replace(/^0+(?=\d)/, '');

  if (thousandsSep && intPart.length > 3) {
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep);
  }

  if (decimal && parts.length > 1) {
    return intPart + decimalSep + (parts[1] ?? '');
  }

  if (decimal && raw.endsWith('.')) {
    return intPart + decimalSep;
  }

  return intPart;
}

export function NumberFormField({
  field: fieldConfig,
  form,
  disabled,
  className,
  decimal = false,
  thousandsSeparator = '.',
  decimalsSeparator = ','
}: NumberFormFieldProps) {
  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => {
        const isInvalid
          = field.state.meta.isTouched && !field.state.meta.isValid;

        const numericValue = field.state.value;
        const displayValue = numericValue != null ? formatDisplay(String(numericValue), decimal, thousandsSeparator, decimalsSeparator) : '';

        const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
          const raw = cleanNumericInput(
            e.target.value,
            decimal,
            thousandsSeparator,
            decimalsSeparator
          );

          if (!raw) {
            field.handleChange(null);

            return;
          }

          const num = Number(raw);

          field.handleChange(Number.isNaN(num) ? null : num);
        };

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FieldLabel htmlFor={field.name}>{fieldConfig.name}</FieldLabel>
            <Input
              id={field.name}
              name={field.name}
              type="text"
              inputMode={decimal ? 'decimal' : 'numeric'}
              value={displayValue}
              onBlur={field.handleBlur}
              className="bg-background"
              onChange={handleInputChange}
              aria-invalid={isInvalid}
              disabled={disabled || fieldConfig.readOnly === true} />
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }} />
  );
}