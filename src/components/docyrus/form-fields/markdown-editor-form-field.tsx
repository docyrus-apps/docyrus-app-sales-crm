'use client'

// @ts-nocheck
/* eslint-disable */
import { Field, FieldError } from '@/components/ui/field'

import { SimpleMarkdownEditor } from '@/components/docyrus/simple-markdown-editor'

import { FormFieldLabel } from './form-field-label'
import { type DocyrusFormFieldProps } from './types'

/*
 * Stable references — `SimpleMarkdownEditor` keys its mount effect on
 * `textareaProps` identity, so passing a fresh `{ readOnly }` object literal on
 * every render would tear down and recreate the OverType instance on each
 * keystroke (the editor would lose focus and drop input). Reuse a constant
 * object when read-only and `undefined` otherwise.
 */
const READONLY_TEXTAREA_PROPS = { readOnly: true } as const

export interface MarkdownEditorFormFieldProps extends DocyrusFormFieldProps {
  /** Show the formatting toolbar (default: true) */
  toolbar?: boolean
  /** Show the word/character stats footer (default: false) */
  showStats?: boolean
  /** Allow vertical resizing via a bottom handle (default: true) */
  resizable?: boolean
  /** Placeholder text shown when the editor is empty */
  placeholder?: string
}

export function MarkdownEditorFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
  toolbar = true,
  showStats = false,
  resizable = true,
  placeholder = 'Write markdown…',
}: MarkdownEditorFormFieldProps) {
  return (
    <form.Field name={fieldConfig.slug}>
      {(field: any) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid
        const isReadOnly = disabled || fieldConfig.readOnly === true

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FormFieldLabel htmlFor={field.name} required={required}>
              {fieldConfig.name}
            </FormFieldLabel>
            <SimpleMarkdownEditor
              id={field.name}
              value={field.state.value ?? ''}
              onValueChange={(value) => field.handleChange(value)}
              onBlur={() => field.handleBlur()}
              toolbar={isReadOnly ? false : toolbar}
              showStats={showStats}
              resizable={resizable}
              minHeight="13.75rem"
              placeholder={placeholder}
              spellcheck={false}
              textareaProps={isReadOnly ? READONLY_TEXTAREA_PROPS : undefined}
              aria-invalid={isInvalid}
            />
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    </form.Field>
  )
}
