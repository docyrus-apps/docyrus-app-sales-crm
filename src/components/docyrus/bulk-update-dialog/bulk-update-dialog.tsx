'use client'

// @ts-nocheck
/* eslint-disable */
import { useCallback, useId, useMemo, useState } from 'react'

import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

import { SchemaRepeater } from '@/components/docyrus/schema-repeater'
import { useDocyrusFormView } from '@/hooks/docyrus/use-docyrus-form-view'

import { type BulkUpdateDialogProps, type BulkUpdateRecord } from './types'

interface FieldEntry {
  /** Stable id for the SchemaRepeater. */
  id: string
  /** Slug picked from the data source — empty string when not chosen yet. */
  slug: string
}

function createEntry(): FieldEntry {
  return { id: cryptoId(), slug: '' }
}

function cryptoId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  return `bulk-${Math.random().toString(36).slice(2, 10)}`
}

export function BulkUpdateDialog({
  open,
  onOpenChange,
  client,
  appSlug,
  dataSourceSlug,
  records,
  enableAutomation = true,
  enableChangeLogging = true,
  onSuccess,
  allowedFieldSlugs,
  className,
}: BulkUpdateDialogProps) {
  const labelId = useId()
  const [entries, setEntries] = useState<Array<FieldEntry>>(() => [
    createEntry(),
  ])

  const formView = useDocyrusFormView({
    client,
    appSlug,
    dataSourceSlug,
    mode: 'create',
    enabled: open,
    gridColumns: 1,
  })

  const fieldOptions = useMemo(() => {
    const slugSet = allowedFieldSlugs ? new Set(allowedFieldSlugs) : null

    return formView.fields
      .filter(
        (field) =>
          !field.readOnly &&
          field.editable &&
          (!slugSet || slugSet.has(field.slug)),
      )
      .map((field) => ({
        value: field.slug,
        label:
          typeof field.field.name === 'string' ? field.field.name : field.slug,
      }))
  }, [formView.fields, allowedFieldSlugs])

  const usedSlugs = useMemo(() => {
    const set = new Set<string>()

    for (const entry of entries) {
      if (entry.slug) set.add(entry.slug)
    }

    return set
  }, [entries])

  const updateMutation = useMutation({
    mutationFn: async (payload: Array<Record<string, unknown>>) => {
      const response = await client.patch<
        { data?: Array<BulkUpdateRecord> } | Array<BulkUpdateRecord>
      >(`/v1/apps/${appSlug}/data-sources/${dataSourceSlug}/items/bulk`, {
        records: payload,
        enableAutomation,
        enableChangeLogging,
      })

      const data = Array.isArray(response)
        ? response
        : ((response as { data?: Array<BulkUpdateRecord> }).data ?? [])

      return data
    },
    onSuccess: (data) => {
      onSuccess?.(data)
      setEntries([createEntry()])
      onOpenChange(false)
    },
  })

  const onSubmit = useCallback(async () => {
    if (records.length === 0) return

    const filledSlugs = entries
      .map((entry) => entry.slug)
      .filter((slug): slug is string => Boolean(slug))

    if (filledSlugs.length === 0) return

    const updates: Record<string, unknown> = {}

    for (const slug of filledSlugs) {
      updates[slug] = formView.values[slug]
    }

    const payload = records.map((record) => ({ id: record.id, ...updates }))

    await updateMutation.mutateAsync(payload)
  }, [records, entries, formView.values, updateMutation])

  const { isPending } = updateMutation
  const filledCount = entries.filter((entry) => Boolean(entry.slug)).length
  const canSubmit =
    !isPending && !formView.isLoading && filledCount > 0 && records.length > 0

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isPending) return
        onOpenChange(next)
      }}
    >
      <DialogContent className={cn('max-w-xl', className)}>
        <DialogHeader>
          <DialogTitle>
            Bulk update
            {records.length > 0
              ? ` · ${records.length} record${records.length === 1 ? '' : 's'}`
              : ''}
          </DialogTitle>
          <DialogDescription>
            Pick the fields you want to overwrite on every selected record.
            Untouched fields stay as they are.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
          {formView.isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : (
            <>
              <Label id={labelId} className="text-sm font-medium">
                Field updates
              </Label>
              <SchemaRepeater<FieldEntry>
                value={entries}
                onValueChange={setEntries}
                createItem={createEntry}
                addLabel="Add field"
                disabled={isPending}
                renderItem={(entry, index, helpers) => (
                  <div className="flex flex-col gap-2 rounded-md border bg-card p-3">
                    <Select
                      value={entry.slug}
                      onValueChange={(slug) => helpers.update({ slug })}
                      disabled={isPending}
                    >
                      <SelectTrigger
                        aria-label={`Field ${index + 1}`}
                        aria-labelledby={labelId}
                      >
                        <SelectValue placeholder="Choose a field…" />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldOptions.map((option) => {
                          const taken =
                            option.value !== entry.slug &&
                            usedSlugs.has(option.value)

                          return (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              disabled={taken}
                            >
                              {option.label}
                              {taken ? ' (already added)' : ''}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    {entry.slug ? (
                      <div className="min-w-0">
                        {formView.renderField(entry.slug, { mode: 'create' })}
                      </div>
                    ) : null}
                  </div>
                )}
              />
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSubmit}
            disabled={!canSubmit}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Update {records.length} record{records.length === 1 ? '' : 's'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
