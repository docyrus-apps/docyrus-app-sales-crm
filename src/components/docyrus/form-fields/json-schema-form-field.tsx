'use client'

// @ts-nocheck
/* eslint-disable */
import { useMemo, useState } from 'react'

import { Braces, Pencil } from 'lucide-react'

import {
  JsonSchemaDesigner,
  type JsonSchema,
} from '@/components/docyrus/json-schema-designer'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError } from '@/components/ui/field'

import { FormFieldLabel } from './form-field-label'
import { type DocyrusFormFieldProps } from './types'

/** Parse a stored field value (object or JSON string) into a JSON Schema. */
function parseSchema(value: unknown): JsonSchema {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as JsonSchema
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as JsonSchema
      }
    } catch {
      /* invalid JSON — fall through to an empty schema */
    }
  }

  return { type: 'object' }
}

/** Count the top-level properties defined on the schema's root object. */
function countSchemaItems(schema: JsonSchema): number {
  const { properties } = schema

  return properties && typeof properties === 'object'
    ? Object.keys(properties).length
    : 0
}

/**
 * Form field for Docyrus `field-jsonSchema`.
 *
 * Renders a hidden input carrying the serialized schema plus a button that
 * opens the {@link JsonSchemaDesigner} in a dialog. The button label reflects
 * how many top-level properties the schema defines (e.g. "4 schema items").
 */
export function JsonSchemaFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
}: DocyrusFormFieldProps) {
  return (
    <form.Field name={fieldConfig.slug}>
      {(field: any) => (
        <JsonSchemaInput
          field={field}
          fieldConfig={fieldConfig}
          disabled={disabled}
          required={required}
          className={className}
        />
      )}
    </form.Field>
  )
}

function JsonSchemaInput({
  field,
  fieldConfig,
  disabled,
  required,
  className,
}: {
  field: any
  fieldConfig: DocyrusFormFieldProps['field']
  disabled?: boolean
  required?: boolean
  className?: string
}) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const isReadOnly = disabled === true || fieldConfig.readOnly === true

  const schema = useMemo(
    () => parseSchema(field.state.value),
    [field.state.value],
  )
  const itemCount = countSchemaItems(schema)

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<JsonSchema>(schema)

  const openDesigner = () => {
    setDraft(schema)
    setOpen(true)
  }

  const saveSchema = () => {
    field.handleChange(draft)
    field.handleBlur()
    setOpen(false)
  }

  const buttonLabel =
    itemCount > 0
      ? `${itemCount} schema item${itemCount === 1 ? '' : 's'}`
      : 'Empty'

  return (
    <Field data-invalid={isInvalid} className={className}>
      <FormFieldLabel required={required}>{fieldConfig.name}</FormFieldLabel>

      {/* Hidden input carries the serialized schema for native form submission. */}
      <input
        type="hidden"
        name={fieldConfig.slug}
        value={JSON.stringify(schema)}
        readOnly
      />

      <Button
        type="button"
        variant="outline"
        disabled={disabled === true}
        onClick={openDesigner}
        className="h-auto w-full justify-start gap-2 py-2 font-normal"
      >
        <Braces className="size-4 shrink-0 text-muted-foreground" />
        <span className="text-sm text-foreground">{buttonLabel}</span>
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Pencil className="size-3" />
          {isReadOnly ? 'View' : 'Edit'}
        </span>
      </Button>

      <FieldDescription>
        Open the designer to define this field’s JSON Schema structure.
      </FieldDescription>

      {isInvalid && <FieldError errors={field.state.meta.errors} />}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-[85vh] max-w-[min(1120px,95vw)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(1120px,95vw)]">
          <DialogHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
            <DialogTitle>{fieldConfig.name || 'JSON Schema'}</DialogTitle>
            <DialogDescription>
              Drag types from the toolbox to build the schema, then save your
              changes.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1">
            <JsonSchemaDesigner
              defaultValue={schema}
              onChange={setDraft}
              readOnly={isReadOnly}
              title={fieldConfig.name || 'JSON Schema'}
              className="h-full rounded-none border-0"
            />
          </div>

          <DialogFooter className="shrink-0 border-t border-border px-4 py-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={saveSchema} disabled={isReadOnly}>
              Save schema
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Field>
  )
}
