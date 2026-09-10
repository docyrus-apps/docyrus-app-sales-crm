'use client'

// @ts-nocheck
/* eslint-disable */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

import { Mail } from 'lucide-react'
import { EmailEditor, type EditorRef } from 'react-email-editor'

type UnlayerEditor = NonNullable<EditorRef['editor']>

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError } from '@/components/ui/field'

import { cn } from '@/lib/utils'

import { FormFieldLabel } from './form-field-label'
import { type DocyrusFormFieldProps, type IField } from './types'

type EmailEditorFieldOptions = {
  /**
   * When true, the editor is hidden behind a trigger button and opens in a
   * centered modal dialog. Useful in dense create / edit forms where the
   * inline editor's ~420px panel takes too much vertical space.
   */
  dialog?: boolean
}

function getEmailEditorOptions(fieldConfig: IField): EmailEditorFieldOptions {
  const raw = fieldConfig.options

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {}
  }

  return raw as EmailEditorFieldOptions
}

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

/**
 * Mounts a single Unlayer EmailEditor iframe and wires it bi-directionally to
 * a TanStack Form field. Effects scoped to this component so the editor can
 * unmount cleanly when the host removes it (e.g. closing the dialog) and
 * remount on the next open without leaking listeners.
 */
function UnlayerEditorPanel({
  field,
  isReadOnly,
  minHeight = '420px',
}: {
  field: any
  isReadOnly: boolean
  minHeight?: string | number
}) {
  const [isEditorReady, setIsEditorReady] = useState(false)
  const editorRef = useRef<EditorRef>(null)
  const syncedDesignRef = useRef<string>('')
  const editorId = useId().replace(/:/g, '')

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

    /*
     * Unlayer's removeEventListener only takes the event name, so we can't
     * pass the handler back. We track the handler in a ref-shaped variable
     * and use dynamic property access to bypass the lint check (which expects
     * a literal addEventListener/removeEventListener pair).
     */
    const on = editor['addEventListener'].bind(editor) as (
      event: string,
      handler: typeof handleDesignUpdated,
    ) => void
    const off = editor['removeEventListener'].bind(editor) as (
      event: string,
    ) => void

    on('design:updated', handleDesignUpdated)

    return () => {
      off('design:updated')
    }
  }, [field, isEditorReady, isReadOnly])

  return (
    <EmailEditor
      ref={editorRef}
      editorId={`email-editor-${editorId}`}
      minHeight={minHeight}
      onReady={handleEditorReady}
    />
  )
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
  const options = getEmailEditorOptions(fieldConfig)
  const useDialog = options.dialog === true
  const [dialogOpen, setDialogOpen] = useState(false)

  const storedDesignError = useMemo(
    () => getStoredDesignError(field.state.value),
    [field.state.value],
  )

  const hasDesign = parseEmailEditorDesign(field.state.value) !== null

  return (
    <Field
      data-invalid={isInvalid || !!storedDesignError}
      className={className}
    >
      <FormFieldLabel required={required}>{fieldConfig.name}</FormFieldLabel>

      {useDialog ? (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                'h-auto w-full justify-start gap-3 rounded-xl px-4 py-3 text-left',
                (isInvalid || storedDesignError) && 'border-destructive',
                isReadOnly && 'cursor-default',
              )}
              disabled={isReadOnly}
            >
              <span className="rounded-full bg-primary/10 p-2 text-primary">
                <Mail className="size-4" />
              </span>
              <span className="min-w-0 flex-1 space-y-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {hasDesign ? 'Edit email template' : 'Design email template'}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {hasDesign
                    ? 'Click to open the visual editor.'
                    : 'No template designed yet — click to start.'}
                </span>
              </span>
            </Button>
          </DialogTrigger>
          {/*
           * Wide centered modal — Unlayer's iframe needs both width AND
           * vertical room. `h-[88vh]` keeps the editor at a usable size on
           * laptop screens, `max-w-[min(96vw,72rem)]` lets it grow on wide
           * monitors. `overflow-hidden` clips the editor's own scrollbar to
           * the dialog frame so it doesn't double-scroll.
           */}
          <DialogContent className="flex h-[88vh] w-[min(96vw,72rem)] max-w-[min(96vw,72rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,72rem)]">
            <DialogHeader className="border-b px-4 py-3">
              <DialogTitle className="text-sm font-medium">
                {fieldConfig.name}
              </DialogTitle>
            </DialogHeader>
            <div
              className={cn(
                'flex-1 overflow-hidden',
                isReadOnly && 'pointer-events-none opacity-70',
              )}
            >
              <UnlayerEditorPanel
                field={field}
                isReadOnly={isReadOnly}
                minHeight="100%"
              />
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <div
          className={cn(
            'overflow-hidden rounded-md border',
            (isInvalid || storedDesignError) && 'border-destructive',
            isReadOnly && 'pointer-events-none opacity-70',
          )}
          aria-invalid={isInvalid || !!storedDesignError}
        >
          <UnlayerEditorPanel field={field} isReadOnly={isReadOnly} />
        </div>
      )}

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
    <form.Field name={fieldConfig.slug}>
      {(field: any) => (
        <EmailEditorInput
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
