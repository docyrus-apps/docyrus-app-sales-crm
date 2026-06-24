'use client'

// @ts-nocheck
/* eslint-disable */
import { useMemo, useState } from 'react'

import { Layers, Pencil } from 'lucide-react'

import { type AdaptiveCardPayload } from '@/components/docyrus/adaptive-card'
import { AdaptiveCardDesigner } from '@/components/docyrus/adaptive-card-designer'
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

const EMPTY_CARD: AdaptiveCardPayload = {
  type: 'AdaptiveCard',
  version: '1.5',
  body: [],
}

/** Parse a stored field value (object or JSON string) into an AdaptiveCardPayload. */
function parsePayload(value: unknown): AdaptiveCardPayload {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (value as { type?: string }).type === 'AdaptiveCard'
  ) {
    return value as AdaptiveCardPayload
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown

      if (
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed) &&
        (parsed as { type?: string }).type === 'AdaptiveCard'
      ) {
        return parsed as AdaptiveCardPayload
      }
    } catch {
      /* invalid JSON — fall through to an empty card */
    }
  }

  return EMPTY_CARD
}

/** Compact, single-line summary used as the trigger button label. */
function summarizePayload(card: AdaptiveCardPayload): string {
  const bodyLen = Array.isArray(card.body) ? card.body.length : 0
  const actionsLen = Array.isArray(card.actions) ? card.actions.length : 0

  if (bodyLen === 0 && actionsLen === 0) return 'Empty'

  const parts: string[] = []

  if (bodyLen > 0) parts.push(`${bodyLen} element${bodyLen === 1 ? '' : 's'}`)
  if (actionsLen > 0)
    parts.push(`${actionsLen} action${actionsLen === 1 ? '' : 's'}`)

  return parts.join(' · ')
}

/**
 * Form field for Docyrus `field-adaptiveCard`.
 *
 * Renders a hidden input carrying the serialized payload plus a button that
 * opens the {@link AdaptiveCardDesigner} in a dialog. The button label reflects
 * how many body elements / actions the card defines (e.g. "4 elements · 1 action").
 */
export function AdaptiveCardFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
}: DocyrusFormFieldProps) {
  return (
    <form.Field name={fieldConfig.slug}>
      {(field: any) => (
        <AdaptiveCardInput
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

function AdaptiveCardInput({
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

  const payload = useMemo(
    () => parsePayload(field.state.value),
    [field.state.value],
  )
  const summary = summarizePayload(payload)

  /*
   * Forward-compat: the host can pre-bind sample data via field options
   * without v1 having to persist it in the value. Sample data is otherwise
   * ephemeral — typing in the designer's sample-data panel does NOT persist
   * across dialog open/close cycles, matching the JsonSchema field's
   * zero-side-state model.
   */
  const defaultSampleData = useMemo(() => {
    const raw = fieldConfig.options?.sampleData

    return raw && typeof raw === 'object' ? raw : {}
  }, [fieldConfig.options])

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<AdaptiveCardPayload>(payload)

  const openDesigner = () => {
    setDraft(payload)
    setOpen(true)
  }

  const saveCard = () => {
    field.handleChange(draft)
    field.handleBlur()
    setOpen(false)
  }

  return (
    <Field data-invalid={isInvalid} className={className}>
      <FormFieldLabel required={required}>{fieldConfig.name}</FormFieldLabel>

      {/* Hidden input carries the serialized payload for native form submission. */}
      <input
        type="hidden"
        name={fieldConfig.slug}
        value={JSON.stringify(payload)}
        readOnly
      />

      <Button
        type="button"
        variant="outline"
        disabled={disabled === true}
        onClick={openDesigner}
        className="h-auto w-full justify-start gap-2 py-2 font-normal"
      >
        <Layers className="size-4 shrink-0 text-muted-foreground" />
        <span className="text-sm text-foreground">{summary}</span>
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Pencil className="size-3" />
          {isReadOnly ? 'View' : 'Edit'}
        </span>
      </Button>

      <FieldDescription>
        Open the designer to author this card&rsquo;s layout and content.
      </FieldDescription>

      {isInvalid && <FieldError errors={field.state.meta.errors} />}

      {/*
       * Dialog is wider (1440px) and taller (90vh) than JsonSchemaFormField's
       * (1120px/85vh) because the designer is a 5-pane layout (toolbox · canvas ·
       * structure / properties · payload JSON · sample data JSON) vs. the schema
       * designer's 3 panes.
       */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-[90vh] max-w-[min(1440px,97vw)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(1440px,97vw)]">
          <DialogHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
            <DialogTitle>{fieldConfig.name || 'Adaptive Card'}</DialogTitle>
            <DialogDescription>
              Drag elements from the toolbox onto the canvas, edit properties on
              the right, and save your changes.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1">
            <AdaptiveCardDesigner
              defaultPayload={draft}
              defaultSampleData={defaultSampleData}
              onChange={({ payload: nextPayload }) => setDraft(nextPayload)}
              readOnly={isReadOnly}
              height="100%"
              className="h-full rounded-none border-0"
            />
          </div>

          <DialogFooter className="shrink-0 border-t border-border px-4 py-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <Button type="button" onClick={saveCard}>
                Save card
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Field>
  )
}
