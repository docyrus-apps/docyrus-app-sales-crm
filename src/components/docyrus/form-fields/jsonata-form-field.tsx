'use client'

// @ts-nocheck
/* eslint-disable */
import { useMemo } from 'react'

import {
  JSONATA_SAMPLES,
  JsonataEditor,
} from '@/components/docyrus/jsonata-editor'
import { Field, FieldDescription, FieldError } from '@/components/ui/field'

import {
  type FieldMappingSchema,
  flattenSchemaContextPaths,
  schemaToSampleData,
} from './field-mapping-form-field'
import { FormFieldLabel } from './form-field-label'
import { type DocyrusFormFieldProps } from './types'

/** Coerce the stored field value into a JSONata expression string. */
function toExpression(value: unknown): string {
  if (typeof value === 'string') return value
  if (value == null) return ''

  return String(value)
}

export interface JsonataFormFieldProps extends DocyrusFormFieldProps {
  /**
   * Optional recursive schema feeding the editor's autocomplete and the
   * compact-mode variable picker dropdown. When provided, the schema is
   * also rendered as the editor's preview input.
   */
  schema?: FieldMappingSchema[]
}

/**
 * Form field for Docyrus `field-jsonata`.
 *
 * Renders an inline {@link JsonataEditor} in compact mode — just the
 * expression editor with an expand button that opens the full input /
 * expression / result workbench in a centered dialog. Pass a `schema` to
 * populate the variable picker dropdown.
 */
export function JsonataFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
  schema,
}: JsonataFormFieldProps) {
  return (
    <form.Field name={fieldConfig.slug}>
      {(field: any) => (
        <JsonataInput
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

function JsonataInput({
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

  const expression = toExpression(field.state.value)

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

      {/* Hidden input carries the expression for native form submission. */}
      <input
        type="hidden"
        name={fieldConfig.slug}
        value={expression}
        readOnly
      />

      <JsonataEditor
        compactMode
        expression={expression}
        onExpressionChange={field.handleChange}
        samples={JSONATA_SAMPLES}
        defaultInput={sampleInput}
        contextPaths={contextPaths}
        readOnly={isReadOnly}
      />

      <FieldDescription>
        Write a JSONata expression. Expand the editor to test against sample
        input.
      </FieldDescription>

      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
