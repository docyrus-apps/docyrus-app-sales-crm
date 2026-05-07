'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

import EmailEditor, { type EditorRef } from 'react-email-editor'

type UnlayerEditor = NonNullable<EditorRef['editor']>

import { Field, FieldDescription, FieldError } from '@/components/ui/field'

import { cn } from '@/lib/utils'

import { FormFieldLabel } from './form-field-label'
import { type DocyrusFormFieldProps } from './types'

type EmailEditorDesign = Record<string, unknown>
type UnlayerDesign = Parameters<UnlayerEditor['loadDesign']>[0]

const isEmailEditorDesign = (value: unknown): value is EmailEditorDesign =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const parseEmailEditorDesign = (value: unknown): EmailEditorDesign | null => {
  if (isEmailEditorDesign(value)) {
    return value
  }

  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown

    return isEmailEditorDesign(parsed) ? parsed : null
  } catch {
    return null
  }
}

const serializeEmailEditorDesign = (
  value: EmailEditorDesign | null,
): string => {
  if (!value) {
    return ''
  }

  try {
    return JSON.stringify(value)
  } catch {
    return ''
  }
}

const getStoredDesignError = (value: unknown): string | null => {
  if (value == null || isEmailEditorDesign(value)) {
    return null
  }

  if (typeof value !== 'string') {
    return 'Stored email design value is not a valid JSON object.'
  }

  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown

    return isEmailEditorDesign(parsed)
      ? null
      : 'Stored email design JSON must be an object.'
  } catch {
    return 'Stored email design value is not valid JSON.'
  }
}

function EmailEditorInput({
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
  const isReadOnly = disabled || fieldConfig.readOnly === true
  const [isEditorReady, setIsEditorReady] = useState(false)

  const editorRef = useRef<EditorRef>(null)
  const syncedDesignRef = useRef<string>('')
  const editorId = useId().replace(/:/g, '')

  const storedDesignError = useMemo(
    () => getStoredDesignError(field.state.value),
    [field.state.value],
  )

  const syncEditorDesign = useCallback(
    (editor: UnlayerEditor, sourceValue: unknown) => {
      const nextDesign = parseEmailEditorDesign(sourceValue)
      const nextSerialized = serializeEmailEditorDesign(nextDesign)

      if (nextSerialized === syncedDesignRef.current) {
        return
      }

      syncedDesignRef.current = nextSerialized

      if (nextDesign) {
        editor.loadDesign(nextDesign as UnlayerDesign)

        return
      }

      editor.loadBlank()
    },
    [],
  )

  const handleEditorReady = useCallback(
    (editor: UnlayerEditor) => {
      setIsEditorReady(true)
      syncEditorDesign(editor, field.state.value)
    },
    [field.state.value, syncEditorDesign],
  )

  useEffect(() => {
    if (!isEditorReady) {
      return
    }

    const editor = editorRef.current?.editor

    if (!editor) {
      return
    }

    syncEditorDesign(editor, field.state.value)
  }, [field.state.value, isEditorReady, syncEditorDesign])

  useEffect(() => {
    if (!isEditorReady || isReadOnly) {
      return
    }

    const editor = editorRef.current?.editor

    if (!editor) {
      return
    }

    const handleDesignUpdated = () => {
      editor.saveDesign((design: unknown) => {
        const nextDesign = parseEmailEditorDesign(design)

        if (!nextDesign) {
          return
        }

        const nextSerialized = serializeEmailEditorDesign(nextDesign)

        if (nextSerialized === syncedDesignRef.current) {
          return
        }

        syncedDesignRef.current = nextSerialized
        field.handleChange(nextDesign)
        field.handleBlur()
      })
    }

    editor.addEventListener('design:updated', handleDesignUpdated)

    return () => {
      editor.removeEventListener('design:updated')
    }
  }, [field, isEditorReady, isReadOnly])

  return (
    <Field
      data-invalid={isInvalid || !!storedDesignError}
      className={className}
    >
      <FormFieldLabel required={required}>{fieldConfig.name}</FormFieldLabel>
      <div
        className={cn(
          'overflow-hidden rounded-md border',
          (isInvalid || storedDesignError) && 'border-destructive',
          isReadOnly && 'pointer-events-none opacity-70',
        )}
        aria-invalid={isInvalid || !!storedDesignError}
      >
        <EmailEditor
          ref={editorRef}
          editorId={`email-editor-${editorId}`}
          minHeight="420px"
          onReady={handleEditorReady}
        />
      </div>
      <FieldDescription>
        Visual email template editor powered by Unlayer. Design JSON is stored
        in this field.
      </FieldDescription>
      {storedDesignError && (
        <p className="text-destructive text-sm">{storedDesignError}</p>
      )}
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}

export function EmailEditorFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
}: DocyrusFormFieldProps) {
  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => (
        <EmailEditorInput
          field={field}
          fieldConfig={fieldConfig}
          disabled={disabled}
          required={required}
          className={className}
        />
      )}
    />
  )
}
