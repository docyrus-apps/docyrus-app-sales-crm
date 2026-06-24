'use client'

// @ts-nocheck
/* eslint-disable */
import { useMemo } from 'react'

import {
  HANDLEBARS_SAMPLES,
  HandlebarsEditor,
} from '@/components/docyrus/handlebars-editor'
import { Field, FieldDescription, FieldError } from '@/components/ui/field'

import {
  type FieldMappingSchema,
  flattenSchemaContextPaths,
  schemaToSampleData,
} from './field-mapping-form-field'
import { FormFieldLabel } from './form-field-label'
import { type DocyrusFormFieldProps } from './types'

/** Coerce the stored field value into a Handlebars template string. */
function toTemplate(value: unknown): string {
  if (typeof value === 'string') return value
  if (value == null) return ''

  return String(value)
}

export interface HandlebarsFormFieldProps extends DocyrusFormFieldProps {
  /**
   * Optional recursive schema feeding the editor's autocomplete and the
   * compact-mode variable picker dropdown. When provided, the schema is
   * also rendered as the editor's preview input.
   */
  schema?: FieldMappingSchema[]
}

/**
 * Form field for Docyrus `field-handlebars`.
 *
 * Renders an inline {@link HandlebarsEditor} in compact mode — just the
 * template editor with an expand button that opens the full template /
 * data / output / preview workbench in a centered dialog. Pass a `schema`
 * to populate the variable picker dropdown.
 */
export function HandlebarsFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
  schema,
}: HandlebarsFormFieldProps) {
  return (
    <form.Field name={fieldConfig.slug}>
      {(field: any) => (
        <HandlebarsInput
          field={field}
          fieldConfig={fieldConfig}
          disabled={disabled}
          required={required}
          className={className}
          schema={schema}
        />
      )}
    </form.Field>
  )
}

function HandlebarsInput({
  field,
  fieldConfig,
  disabled,
  required,
  className,
  schema,
}: {
  field: any
  fieldConfig: DocyrusFormFieldProps['field']
  disabled?: boolean
  required?: boolean
  className?: string
  schema?: FieldMappingSchema[]
}) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const isReadOnly = disabled === true || fieldConfig.readOnly === true

  const template = toTemplate(field.state.value)

  const sampleInput = useMemo(
    () =>
      schema && schema.length > 0 ? schemaToSampleData(schema) : undefined,
    [schema],
  )
  const contextPaths = useMemo(
    () =>
      schema && schema.length > 0
        ? flattenSchemaContextPaths(schema)
        : undefined,
    [schema],
  )

  return (
    <Field data-invalid={isInvalid} className={className}>
      <FormFieldLabel required={required}>{fieldConfig.name}</FormFieldLabel>

      {/* Hidden input carries the template for native form submission. */}
      <input type="hidden" name={fieldConfig.slug} value={template} readOnly />

      <HandlebarsEditor
        compactMode
        template={template}
        onTemplateChange={field.handleChange}
        samples={HANDLEBARS_SAMPLES}
        defaultInput={sampleInput}
        contextPaths={contextPaths}
        readOnly={isReadOnly}
      />

      <FieldDescription>
        Write a Handlebars template. Expand the editor to preview against sample
        data.
      </FieldDescription>

      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
