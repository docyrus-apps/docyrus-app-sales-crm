'use client'

// @ts-nocheck
/* eslint-disable */
import {
  ContactChannelsManager,
  type ContactBrand,
  type ContactChannel,
} from '@/components/docyrus/contact-channels-field'
import { Field, FieldDescription, FieldError } from '@/components/ui/field'

import { FormFieldLabel } from './form-field-label'
import { type DocyrusFormFieldProps } from './types'

/** Coerce a stored field value into a channel array. */
function toChannels(value: unknown): ContactChannel[] {
  return Array.isArray(value) ? (value as ContactChannel[]) : []
}

export interface ContactChannelsFormFieldProps extends DocyrusFormFieldProps {
  /** Brands for labelling / scoping consent (omit for tenant-wide only). */
  brands?: ContactBrand[]
  /** Show the inline consent editor per channel. Default `true`. */
  enableConsent?: boolean
  /** Show validation status chips. Default `true`. */
  enableValidation?: boolean
  /** Group channels under kind headers. Default `true`. */
  groupByKind?: boolean
}

/**
 * Form field for a record's contact channels. Stores a {@link ContactChannel}
 * array on the bound field and edits it inline with the backend-agnostic
 * {@link ContactChannelsManager}. For live API-backed management (consent ledger,
 * validation engine, archive/restore), use `ContactChannelsPanel` instead.
 */
export function ContactChannelsFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
  brands,
  enableConsent,
  enableValidation,
  groupByKind,
}: ContactChannelsFormFieldProps) {
  return (
    <form.Field name={fieldConfig.slug}>
      {(field: any) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid
        const isReadOnly = disabled === true || fieldConfig.readOnly === true

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FormFieldLabel required={required}>
              {fieldConfig.name}
            </FormFieldLabel>

            <ContactChannelsManager
              value={toChannels(field.state.value)}
              onChange={(next) => {
                field.handleChange(next)
                field.handleBlur()
              }}
              brands={brands}
              readOnly={isReadOnly}
              enableConsent={enableConsent}
              enableValidation={enableValidation}
              groupByKind={groupByKind}
            />

            <FieldDescription>
              Add emails, phones, messaging handles and social profiles. Mark
              one primary per kind.
            </FieldDescription>

            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    </form.Field>
  )
}
