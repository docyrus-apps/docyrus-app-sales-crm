'use client'

import { useCallback, useMemo, useState, type RefObject } from 'react'

import { RotateCcw, Save } from 'lucide-react'
import { type Table } from '@tanstack/react-table'

import {
  ActionBar,
  ActionBarGroup,
  ActionBarSeparator,
} from '@/components/ui/action-bar'
import { Button } from '@/components/ui/button'

import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'

import { useUiTranslation } from '@/lib/use-ui-translation'

interface ChangeMapEntry<TData> {
  originalRow: TData
  dataIndex: number
  changes: Map<string, { originalValue: unknown; newValue: unknown }>
}

interface DataGridChangeActionBarProps<TData> {
  changedRowCount: number
  changeMapRef: RefObject<Map<string, ChangeMapEntry<TData>>>
  table: Table<TData>
  onSave: () => void | Promise<void>
  onDiscard: () => void
  sideOffset?: number
  getRowLabel?: (row: TData, rowIndex: number) => string
}

export function DataGridChangeActionBar<TData>({
  changedRowCount,
  changeMapRef,
  table,
  onSave,
  onDiscard,
  sideOffset = 16,
  getRowLabel,
}: DataGridChangeActionBarProps<TData>) {
  const { t } = useUiTranslation()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const columnLabelMap = useMemo(() => {
    const map = new Map<string, string>()

    for (const col of table.getAllColumns()) {
      map.set(col.id, col.columnDef.meta?.label ?? col.id)
    }

    return map
  }, [table])

  const onSaveClick = useCallback(async () => {
    setIsSaving(true)

    try {
      await onSave()
    } finally {
      setIsSaving(false)
    }
  }, [onSave])

  const changes = useMemo(() => {
    if (changedRowCount === 0) return []

    const entries: Array<{
      rowId: string
      rowLabel: string
      fields: Array<{
        label: string
        oldValue: string
        newValue: string
      }>
    }> = []

    for (const [rowId, entry] of changeMapRef.current) {
      const fields: Array<{
        label: string
        oldValue: string
        newValue: string
      }> = []

      for (const [colId, change] of entry.changes) {
        fields.push({
          label: columnLabelMap.get(colId) ?? colId,
          oldValue: formatValue(change.originalValue),
          newValue: formatValue(change.newValue),
        })
      }

      const rowLabel = getRowLabel
        ? getRowLabel(entry.originalRow, entry.dataIndex)
        : `Row ${entry.dataIndex + 1}`

      entries.push({ rowId, rowLabel, fields })
    }

    return entries
  }, [changeMapRef, columnLabelMap, getRowLabel, changedRowCount])

  return (
    <ActionBar
      open
      onOpenChange={noop}
      sideOffset={sideOffset}
      data-grid-popover
    >
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="rounded-sm px-2 py-1 text-sm font-medium tabular-nums underline decoration-dotted underline-offset-4 hover:decoration-solid"
          >
            {changedRowCount}{' '}
            {changedRowCount === 1
              ? t('ui.dataGrid.item', 'item')
              : t('ui.dataGrid.itemsChanged', 'items changed')}
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="center"
          className="max-h-72 w-96 overflow-y-auto p-0"
          data-grid-popover
        >
          <PopoverHeader className="sticky top-0 z-10 border-b bg-popover px-3 py-2">
            <PopoverTitle>
              {t('ui.dataGrid.changesPending', 'Pending Changes')}
            </PopoverTitle>
          </PopoverHeader>
          <div className="divide-y">
            {changes.map((row) => (
              <div key={row.rowId} className="px-3 py-2">
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  {row.rowLabel}
                </div>
                {row.fields.map((field) => (
                  <div
                    key={field.label}
                    className="flex items-center gap-1.5 py-0.5 text-xs"
                  >
                    <span className="shrink-0 font-medium">{field.label}:</span>
                    <span
                      className="max-w-24 truncate text-muted-foreground line-through"
                      title={field.oldValue}
                    >
                      {field.oldValue || t('ui.dataGrid.cellEmpty', '(empty)')}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      &rarr;
                    </span>
                    <span
                      className="max-w-24 truncate text-foreground"
                      title={field.newValue}
                    >
                      {field.newValue || t('ui.dataGrid.cellEmpty', '(empty)')}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <ActionBarSeparator />
      <ActionBarGroup>
        <Button variant="ghost" size="sm" onClick={onDiscard}>
          <RotateCcw className="size-3.5" />
          {t('ui.common.cancel', 'Cancel')}
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onSaveClick}
          disabled={isSaving}
        >
          <Save className="size-3.5" />
          {isSaving
            ? t('ui.dataGrid.saving', 'Saving...')
            : t('ui.dataGrid.save', 'Save')}
        </Button>
      </ActionBarGroup>
    </ActionBar>
  )
}

function noop() {}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(String).join(', ')

  return JSON.stringify(value)
}
