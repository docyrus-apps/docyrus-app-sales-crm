// @docyrus: [[architecture#Shared Record Detail Layout]]
import { type ReactNode, useMemo } from 'react'

import { useForm } from '@tanstack/react-form'
import { useTranslation } from 'react-i18next'

import { DynamicFormField } from '@/components/docyrus/form-fields'
import {
  type FieldChange,
  type RecordDetailField
} from '@/components/docyrus/editable-record-detail'
import { Button } from '@/components/ui/button'

interface FieldRendererProps {
  record: Record<string, unknown>;
  save: (patch: Record<string, unknown>) => void | Promise<void>;
  readOnly: boolean;
}

interface RecordEditFormProps {
  /** Field configurations keyed later by slug. */
  fields: Array<RecordDetailField>;
  /** Ordered slugs to render (matches the attribute panel order). */
  fieldSlugs: Array<string>;
  /** Current record values keyed by field slug. */
  record: Record<string, unknown>;
  /** Per-slug custom renderers (e.g. location, contact name). Self-saving. */
  fieldRenderers?: Record<string, (props: FieldRendererProps) => ReactNode>;
  /** Persist the diffed changes when the form is submitted. */
  onSave: (
    changes: Array<FieldChange>,
    values: Record<string, unknown>
  ) => void | Promise<void>;
  /** Persist a partial patch coming from a custom field renderer. */
  onFieldSave: (patch: Record<string, unknown>) => void | Promise<void>;
  /** Close the modal without saving. */
  onCancel: () => void;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  if (typeof a === 'object' && typeof b === 'object') {
    return JSON.stringify(a) === JSON.stringify(b)
  }

  return false
}

/**
 * A plain, always-editable modal form built from a record's field configs.
 *
 * Unlike the inline attribute panel — which uses click-to-edit `EditableValue`
 * cells that portal a floating editor to `document.body` — this renders every
 * field as a standard always-open input inside a normal scrollable form with a
 * single Save/Cancel footer. The floating-editor pattern breaks inside a
 * scrollable dialog (the fixed-position editor detaches from its anchor on
 * scroll and the caret never engages), which is why the "Edit all" modal uses
 * this component instead.
 */
export function RecordEditForm({
  fields,
  fieldSlugs,
  record,
  fieldRenderers,
  onSave,
  onFieldSave,
  onCancel
}: RecordEditFormProps) {
  const { t } = useTranslation()

  const fieldBySlug = useMemo(() => {
    const map = new Map<string, RecordDetailField>()

    for (const entry of fields) map.set(entry.field.slug, entry)

    return map
  }, [fields])

  /*
   * Only the standard (non-custom-renderer) fields are form-managed; custom
   * renderers persist themselves via `onFieldSave`.
   */
  const managedSlugs = useMemo(
    () => fieldSlugs.filter(slug => fieldBySlug.has(slug) && !fieldRenderers?.[slug]),
    [fieldSlugs, fieldBySlug, fieldRenderers]
  )

  const form = useForm({
    defaultValues: Object.fromEntries(
      managedSlugs.map(slug => [slug, record[slug] ?? null])
    ),
    onSubmit: async ({ value }) => {
      const changes: Array<FieldChange> = []

      for (const slug of managedSlugs) {
        const next = value[slug]

        if (valuesEqual(record[slug], next)) continue

        changes.push({
          fieldSlug: slug,
          fieldName: fieldBySlug.get(slug)?.field.name ?? slug,
          originalValue: record[slug],
          newValue: next
        })
      }

      await onSave(changes, { ...record, ...value })
    }
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
      className="flex min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 pb-2">
        {fieldSlugs.map((slug) => {
          const entry = fieldBySlug.get(slug)

          if (!entry) return null

          const isHidden =
            typeof entry.hidden === 'function'
              ? entry.hidden(record)
              : entry.hidden

          if (isHidden) return null

          const custom = fieldRenderers?.[slug]

          if (custom) {
            return (
              <div key={slug} className="space-y-1.5">
                <div className="text-[13px] font-medium text-muted-foreground">
                  {entry.field.name}
                </div>
                {custom({
                  record,
                  save: onFieldSave,
                  readOnly: entry.readOnly ?? false
                })}
              </div>
            )
          }

          const isRequired =
            typeof entry.required === 'function'
              ? entry.required(record)
              : entry.required

          return (
            <DynamicFormField
              key={slug}
              field={entry.field}
              form={form}
              enumOptions={entry.enumOptions}
              appSlug={entry.appSlug}
              dataSourceSlug={entry.dataSourceSlug}
              disabled={entry.readOnly}
              required={isRequired} />
          )
        })}
      </div>

      <form.Subscribe selector={state => state.isSubmitting}>
        {isSubmitting => (
          <div className="mt-4 flex shrink-0 items-center justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}>
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? t('common.saving', { defaultValue: 'Saving...' })
                : t('common.save', { defaultValue: 'Save' })}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  )
}
