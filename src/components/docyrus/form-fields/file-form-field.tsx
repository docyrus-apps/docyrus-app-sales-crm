'use client'

// @ts-nocheck
/* eslint-disable */
import { useState } from 'react'

import { FileIcon } from 'lucide-react'

import { Field, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

import { FormFieldLabel } from './form-field-label'
import { type DocyrusFormFieldProps } from './types'

function getFileName(value: unknown): string | null {
  if (typeof value === 'string') return value

  if (value && typeof value === 'object') {
    const record = value as { name?: string; file_name?: string }

    return record.file_name ?? record.name ?? null
  }

  return null
}

export function FileFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
  onFileUpload,
}: DocyrusFormFieldProps) {
  const [uploading, setUploading] = useState(false)

  return (
    <form.Field name={fieldConfig.slug}>
      {(field: any) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid

        const fileName = getFileName(field.state.value)

        const onSelect = async (file: File) => {
          /*
           * Without an upload handler the raw `File` would be stored and then
           * JSON-serialize to `{}`, silently dropping the file. With one, we
           * upload to Docyrus storage and store the returned value shape.
           */
          if (!onFileUpload) {
            field.handleChange(file)

            return
          }

          setUploading(true)
          try {
            const result = await onFileUpload(file)

            if (result) field.handleChange(result)
          } finally {
            setUploading(false)
          }
        }

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FormFieldLabel htmlFor={field.name} required={required}>
              {fieldConfig.name}
            </FormFieldLabel>
            {fileName && (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <FileIcon className="size-4" />
                <span className="truncate">{fileName}</span>
              </div>
            )}
            <Input
              id={field.name}
              name={field.name}
              type="file"
              onBlur={field.handleBlur}
              onChange={(e) => {
                const file = e.target.files?.[0]

                if (file) void onSelect(file)
                e.target.value = ''
              }}
              aria-invalid={isInvalid}
              disabled={disabled || fieldConfig.readOnly === true || uploading}
            />
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    </form.Field>
  )
}
