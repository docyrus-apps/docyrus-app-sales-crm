'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useVirtualizer } from '@tanstack/react-virtual'
import { type Row, type Table, type TableMeta } from '@tanstack/react-table'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

import { cn } from '@/lib/utils'

import { type CellOpts, type DataGridCardConfig } from './types'
import { DataGridCardField } from './data-grid-card-field'

const MIN_CARD_WIDTH = 280
const ESTIMATED_ROW_HEIGHT = 220
const GALLERY_GAP = 16

function getColumnLabel<TData>(table: Table<TData>, columnId: string): string {
  const column = table.getColumn(columnId)

  if (!column) return columnId

  const label = column.columnDef.meta?.label

  if (label) return label

  const { header } = column.columnDef

  if (typeof header === 'string') return header

  return columnId
}

function getCellOpts<TData>(
  table: Table<TData>,
  columnId: string,
): CellOpts | undefined {
  return table.getColumn(columnId)?.columnDef.meta?.cell
}

function getCellValue<TData>(row: Row<TData>, columnId: string): unknown {
  try {
    return row.getValue(columnId)
  } catch {
    return undefined
  }
}

interface DataGridGalleryCardProps<TData> {
  row: Row<TData>
  table: Table<TData>
  tableMeta: TableMeta<TData>
  cardConfig?: DataGridCardConfig<TData>
  visibleColumnIds: Array<string>
  enableSelection: boolean
}

function DataGridGalleryCard<TData>({
  row,
  table,
  tableMeta: _tableMeta,
  cardConfig,
  visibleColumnIds,
  enableSelection,
}: DataGridGalleryCardProps<TData>) {
  const isSelected = row.getIsSelected()

  const onCheckedChange = useCallback(
    (checked: boolean) => {
      row.toggleSelected(checked)
    },
    [row],
  )

  if (cardConfig?.renderCard) {
    return <>{cardConfig.renderCard(row.original, row.index)}</>
  }

  const titleField = cardConfig?.titleField
  const descriptionField = cardConfig?.descriptionField
  const imageField = cardConfig?.imageField

  const specialFields = new Set<string>()

  if (titleField) specialFields.add(titleField)
  if (descriptionField) specialFields.add(descriptionField)
  if (imageField) specialFields.add(imageField)

  const bodyFields =
    cardConfig?.bodyFields ??
    visibleColumnIds.filter((id) => !specialFields.has(id))

  const imageValue = imageField ? getCellValue(row, imageField) : undefined
  const imageSrc = typeof imageValue === 'string' ? imageValue : undefined

  return (
    <Card
      size="sm"
      className={cn(
        'cursor-default transition-colors',
        isSelected && 'ring-2 ring-primary',
      )}
    >
      {imageSrc && (
        <img
          src={imageSrc}
          alt=""
          className="h-32 w-full rounded-t-xl object-cover"
        />
      )}
      <CardHeader>
        <div className="flex items-start gap-2">
          {enableSelection && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={onCheckedChange}
              aria-label={`Select row ${row.index + 1}`}
              className="mt-0.5 shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            {titleField && (
              <CardTitle className="truncate">
                {String(getCellValue(row, titleField) ?? '')}
              </CardTitle>
            )}
            {descriptionField && (
              <CardDescription className="truncate">
                {String(getCellValue(row, descriptionField) ?? '')}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      {bodyFields.length > 0 && (
        <CardContent className="grid gap-2">
          {bodyFields.map((columnId) => {
            if (specialFields.has(columnId)) return null

            const value = getCellValue(row, columnId)

            if (value == null || value === '') return null

            const label = getColumnLabel(table, columnId)
            const cellOpts = getCellOpts(table, columnId)

            return (
              <div key={columnId} className="flex items-start gap-2 text-sm">
                <span className="w-24 shrink-0 truncate text-muted-foreground">
                  {label}
                </span>
                <div className="min-w-0 flex-1">
                  <DataGridCardField value={value} cellOpts={cellOpts} />
                </div>
              </div>
            )
          })}
        </CardContent>
      )}
    </Card>
  )
}

interface DataGridGalleryProps<TData> {
  table: Table<TData>
  tableMeta: TableMeta<TData>
  cardConfig?: DataGridCardConfig<TData>
  height?: number | 'auto'
  className?: string
}

export function DataGridGallery<TData>({
  table,
  tableMeta,
  cardConfig,
  height = 600,
  className,
}: DataGridGalleryProps<TData>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [columnsPerRow, setColumnsPerRow] = useState(3)

  const { rows } = table.getRowModel()

  const enableSelection =
    rows.length > 0 &&
    rows[0] !== undefined &&
    typeof rows[0].getCanSelect === 'function' &&
    rows[0].getCanSelect()

  const visibleColumnIds = useMemo(() => {
    return table
      .getAllLeafColumns()
      .filter(
        (col) =>
          col.getIsVisible() &&
          col.id !== 'select' &&
          col.id !== 'actions' &&
          typeof col.accessorFn !== 'undefined',
      )
      .map((col) => col.id)
  }, [table])

  useEffect(() => {
    const container = containerRef.current

    if (!container) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]

      if (!entry) return

      const { width } = entry.contentRect
      const cols = Math.max(1, Math.floor(width / MIN_CARD_WIDTH))

      setColumnsPerRow(cols)
    })

    observer.observe(container)

    return () => observer.disconnect()
  }, [])

  const virtualRowCount = Math.ceil(rows.length / columnsPerRow)

  const virtualizer = useVirtualizer({
    count: virtualRowCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 2,
  })

  const virtualItems = virtualizer.getVirtualItems()

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto rounded-md border', className)}
      style={
        height === 'auto' ? { height: '100%' } : { maxHeight: `${height}px` }
      }
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualItems.map((virtualItem) => {
          const startIndex = virtualItem.index * columnsPerRow
          const rowSlice = rows.slice(startIndex, startIndex + columnsPerRow)

          return (
            <div
              key={virtualItem.key}
              className="absolute inset-x-0"
              style={{
                top: `${virtualItem.start}px`,
                height: `${virtualItem.size}px`,
                padding: `${GALLERY_GAP / 2}px ${GALLERY_GAP}px`,
              }}
            >
              <div
                className="grid h-full gap-4"
                style={{
                  gridTemplateColumns: `repeat(${columnsPerRow}, minmax(0, 1fr))`,
                }}
              >
                {rowSlice.map((row) => (
                  <DataGridGalleryCard
                    key={row.id}
                    row={row}
                    table={table}
                    tableMeta={tableMeta}
                    cardConfig={cardConfig}
                    visibleColumnIds={visibleColumnIds}
                    enableSelection={enableSelection}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
