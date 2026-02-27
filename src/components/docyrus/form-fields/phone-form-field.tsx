'use client';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';

import {
  PhoneInput,
  PhoneInputCountrySelect,
  PhoneInputField
} from '@/components/ui/phone-input';

import { type DocyrusFormFieldProps } from './types';

import { getCompanionFieldSlug } from './lib/utils';

export function PhoneFormField({
  field: fieldConfig,
  form,
  disabled,
  className
}: DocyrusFormFieldProps) {
  const countrySlug = getCompanionFieldSlug(fieldConfig.slug, 'country');

  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => {
        const isInvalid
          = field.state.meta.isTouched && !field.state.meta.isValid;

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FieldLabel htmlFor={field.name}>{fieldConfig.name}</FieldLabel>
            <form.Field
              name={countrySlug}
              children={(countryField: any) => (
                <PhoneInput
                  value={field.state.value ?? ''}
                  onValueChange={val => field.handleChange(val)}
                  country={countryField.state.value ?? ''}
                  onCountryChange={code => countryField.handleChange(code)}
                  disabled={disabled || fieldConfig.readOnly === true}
                  invalid={isInvalid}>
                  <PhoneInputCountrySelect />
                  <PhoneInputField
                    onBlur={field.handleBlur}
                    aria-invalid={isInvalid} />
                </PhoneInput>
              )} />
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }} />
  );
}