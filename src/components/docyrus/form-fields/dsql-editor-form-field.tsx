'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react'

import {
  DsqlEditor,
  type DsqlAiAssistantRenderProps,
  type SQLNamespace,
} from '@/components/docyrus/dsql-editor'
import { Field, FieldDescription, FieldError } from '@/components/ui/field'

import { FormFieldLabel } from './form-field-label'
import { type DocyrusFormFieldProps } from './types'

/** Coerce the stored field value into a SQL query string. */
function toQuery(value: unknown): string {
  if (typeof value === 'string') return value
  if (value == null) return ''

  return String(value)
}

export interface DsqlEditorFormFieldProps extends DocyrusFormFieldProps {
  /**
   * Optional SQL autocomplete schema (`appSlug → dataSourceSlug → columns`).
   * Build it from `useDsqlSchema` or `dsqlSchemasToNamespace`. When provided,
   * `from base.` completes table names and `base.contact.` completes columns.
   */
  schema?: SQLNamespace
  /** Minimum editor height in compact mode. Default `'2.5rem'`. */
  compactMinHeight?: string
  /** Maximum editor height in compact mode. Default `'12rem'`. */
  compactMaxHeight?: string
  /** Controls the AI assistant drawer open state (controlled mode). */
  aiAssistantOpen?: boolean
  /** Called when the AI assistant drawer requests open/close. */
  onAiAssistantOpenChange?: (open: boolean) => void
  /** Renders the AI assistant panel inside the expanded editor dialog. */
  renderAiAssistant?: (ctx: DsqlAiAssistantRenderProps) => ReactNode
}

/**
 * Form field for a DSQL expression.
 *
 * Renders an inline {@link DsqlEditor} in compact mode — just the SQL editor
 * with an expand button that opens the full query / result workbench in a
 * centered dialog.
 */
export function DsqlEditorFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
  schema,
  compactMinHeight,
  compactMaxHeight,
  aiAssistantOpen,
  onAiAssistantOpenChange,
  renderAiAssistant,
}: DsqlEditorFormFieldProps) {
  return (
    <form.Field name={fieldConfig.slug}>
      {(field: any) => (
        <DsqlEditorInput
          field={field}
          fieldConfig={fieldConfig}
          disabled={disabled}
          required={required}
          className={className}
          schema={schema}
          compactMinHeight={compactMinHeight}
          compactMaxHeight={compactMaxHeight}
          aiAssistantOpen={aiAssistantOpen}
          onAiAssistantOpenChange={onAiAssistantOpenChange}
          renderAiAssistant={renderAiAssistant}
        />
      )}
    </form.Field>
  )
}

function DsqlEditorInput({
  field,
  fieldConfig,
  disabled,
  required,
  className,
  schema,
  compactMinHeight,
  compactMaxHeight,
  aiAssistantOpen,
  onAiAssistantOpenChange,
  renderAiAssistant,
}: {
  field: any
  fieldConfig: DocyrusFormFieldProps['field']
  disabled?: boolean
  required?: boolean
  className?: string
  schema?: SQLNamespace
  compactMinHeight?: string
  compactMaxHeight?: string
  aiAssistantOpen?: boolean
  onAiAssistantOpenChange?: (open: boolean) => void
  renderAiAssistant?: (ctx: DsqlAiAssistantRenderProps) => ReactNode
}) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const isReadOnly = disabled === true || fieldConfig.readOnly === true

  const query = toQuery(field.state.value)

  return (
    <Field data-invalid={isInvalid} className={className}>
      <FormFieldLabel required={required}>{fieldConfig.name}</FormFieldLabel>

      {/* Hidden input carries the query for native form submission. */}
      <input type="hidden" name={fieldConfig.slug} value={query} readOnly />

      <DsqlEditor
        compactMode
        query={query}
        onQueryChange={isReadOnly ? undefined : field.handleChange}
        schema={schema}
        compactMinHeight={compactMinHeight}
        compactMaxHeight={compactMaxHeight}
        aiAssistantOpen={aiAssistantOpen}
        onAiAssistantOpenChange={onAiAssistantOpenChange}
        renderAiAssistant={renderAiAssistant}
      />

      <FieldDescription>
        Write a DSQL query. Expand the editor to run it against your data
        sources.
      </FieldDescription>

      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
