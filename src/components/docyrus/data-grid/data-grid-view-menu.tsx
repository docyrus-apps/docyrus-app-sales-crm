'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from 'react'

import { type Column, type Table } from '@tanstack/react-table'

import { Check, GripVertical, RotateCcw, Settings2, Trash2 } from 'lucide-react'

import { useDirection } from '@/components/ui/direction'

import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from '@/components/ui/sortable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import { useUiTranslation } from '@/lib/use-ui-translation'

import { isSavedDataGridView, type SavedDataGridView } from './types'
import {
  applyViewToTable,
  captureViewSnapshot,
  getColumnLabel,
  getGeneratedViewId,
  getManagedColumns,
} from './lib/view-utils'

interface DataGridViewMenuProps<TData> extends ComponentProps<
  typeof PopoverContent
> {
  table: Table<TData>
  disabled?: boolean
  storageKey?: string
}

export function DataGridViewMenu<TData>({
  table,
  disabled,
  storageKey = 'default',
  className,
  ...props
}: DataGridViewMenuProps<TData>) {
  const { t } = useUiTranslation()
  const dir = useDirection()
  const [open, setOpen] = useState(false)
  const [savingView, setSavingView] = useState(false)
  const [viewName, setViewName] = useState('')
  const viewNameInputRef = useRef<HTMLInputElement>(null)
  const [savedViews, setSavedViews] = useState<Array<SavedDataGridView>>([])

  const localStorageKey = useMemo(() => {
    return `docyrus:data-grid:views:${storageKey}`
  }, [storageKey])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const raw = window.localStorage.getItem(localStorageKey)

      if (!raw) {
        setSavedViews([])

        return
      }

      const parsed = JSON.parse(raw) as unknown

      if (!Array.isArray(parsed)) {
        setSavedViews([])

        return
      }

      setSavedViews(parsed.filter(isSavedDataGridView))
    } catch {
      setSavedViews([])
    }
  }, [localStorageKey])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(localStorageKey, JSON.stringify(savedViews))
    } catch {}
  }, [localStorageKey, savedViews])

  const allLeafColumns = table.getAllLeafColumns()

  const managedColumns = useMemo(() => getManagedColumns(table), [table])

  const effectiveColumnOrder = useMemo(() => {
    const { columnOrder } = table.getState()

    if (columnOrder.length > 0) {
      return columnOrder
    }

    return allLeafColumns.map((column) => column.id)
  }, [allLeafColumns, table])

  const managedColumnsOrdered = useMemo(() => {
    const orderById = new Map(
      effectiveColumnOrder.map((columnId, index) => [columnId, index]),
    )

    return [...managedColumns].sort((a, b) => {
      return (
        (orderById.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (orderById.get(b.id) ?? Number.MAX_SAFE_INTEGER)
      )
    })
  }, [effectiveColumnOrder, managedColumns])

  const onColumnsReorder = useCallback(
    (nextColumns: Array<Column<TData, unknown>>) => {
      const managedColumnIds = nextColumns.map((column) => column.id)
      const managedColumnSet = new Set(managedColumnIds)

      let nextManagedIndex = 0
      const nextOrder = effectiveColumnOrder.map((columnId) => {
        if (!managedColumnSet.has(columnId)) {
          return columnId
        }

        const nextColumnId = managedColumnIds.at(nextManagedIndex)

        nextManagedIndex += 1

        return nextColumnId ?? columnId
      })

      for (const columnId of managedColumnIds) {
        if (!nextOrder.includes(columnId)) {
          nextOrder.push(columnId)
        }
      }

      table.setColumnOrder(nextOrder)
    },
    [effectiveColumnOrder, table],
  )

  const onColumnToggle = useCallback((column: Column<TData, unknown>) => {
    if (!column.getCanHide()) return
    column.toggleVisibility(!column.getIsVisible())
  }, [])

  const getCurrentViewSnapshot = useCallback(
    () => captureViewSnapshot(table),
    [table],
  )

  const onStartSaveView = useCallback(() => {
    setSavingView(true)
    setViewName('')
    requestAnimationFrame(() => viewNameInputRef.current?.focus())
  }, [])

  const onCancelSaveView = useCallback(() => {
    setSavingView(false)
    setViewName('')
  }, [])

  const onConfirmSaveView = useCallback(() => {
    const normalizedName = viewName.trim()

    if (!normalizedName) return

    const snapshot = getCurrentViewSnapshot()

    setSavedViews((currentViews) => {
      const existing = currentViews.find(
        (view) => view.name.toLowerCase() === normalizedName.toLowerCase(),
      )

      const nextView: SavedDataGridView = {
        id: existing?.id ?? getGeneratedViewId(),
        name: normalizedName,
        ...snapshot,
      }

      if (existing) {
        return currentViews.map((view) =>
          view.id === existing.id ? nextView : view,
        )
      }

      return [nextView, ...currentViews]
    })

    setSavingView(false)
    setViewName('')
  }, [getCurrentViewSnapshot, viewName])

  const onApplyView = useCallback(
    (view: SavedDataGridView) => {
      applyViewToTable(table, view)
      setOpen(false)
    },
    [table],
  )

  const onViewDelete = useCallback((viewId: string) => {
    setSavedViews((currentViews) =>
      currentViews.filter((view) => view.id !== viewId),
    )
  }, [])

  const onResetView = useCallback(() => {
    table.resetColumnVisibility()
    table.resetColumnOrder()
    table.resetColumnPinning()
    table.resetSorting()
    table.resetColumnFilters()
    table.resetGrouping()
    table.options.meta?.onRowHeightChange?.('short')
    table.options.meta?.onDisplayModeChange?.('table')
  }, [table])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-label={t('ui.dataGrid.toggleColumns', 'Toggle columns')}
          role="button"
          dir={dir}
          variant="outline"
          size="sm"
          className="h-8 font-normal"
          disabled={disabled}
        >
          <Settings2 className="text-muted-foreground" />
          {t('ui.dataGrid.configure', 'Configure')}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        dir={dir}
        className={cn('w-90 p-3', className)}
        {...props}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm">
              {t('ui.dataGrid.columns', 'Columns')}
            </p>
            {savingView ? (
              <form
                className="flex items-center gap-1"
                onSubmit={(e) => {
                  e.preventDefault()
                  onConfirmSaveView()
                }}
              >
                <Input
                  ref={viewNameInputRef}
                  value={viewName}
                  onChange={(e) => setViewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && onCancelSaveView()}
                  placeholder={t('ui.dataGrid.viewName', 'View name')}
                  className="h-7 w-36 text-sm"
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="h-7"
                  disabled={!viewName.trim()}
                >
                  <Check className="size-3.5" />
                </Button>
              </form>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                onClick={onStartSaveView}
                disabled={disabled}
              >
                {t('ui.dataGrid.saveCurrentView', 'Save current')}
              </Button>
            )}
          </div>

          <Sortable
            value={managedColumnsOrdered}
            getItemValue={(column) => column.id}
            onValueChange={onColumnsReorder}
            orientation="vertical"
          >
            <SortableContent className="max-h-60 space-y-1 overflow-y-auto">
              {managedColumnsOrdered.map((column) => {
                const isVisible = column.getIsVisible()
                const canHide = column.getCanHide()

                return (
                  <SortableItem key={column.id} value={column.id} asChild>
                    <div className="flex items-center gap-1 rounded-sm border px-1 py-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 min-w-0 flex-1 justify-start px-1.5"
                        onClick={() => onColumnToggle(column)}
                        disabled={!canHide}
                      >
                        <Check
                          className={cn(
                            'size-4 shrink-0',
                            isVisible ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <span className="truncate text-sm">
                          {getColumnLabel(column)}
                        </span>
                      </Button>
                      <SortableItemHandle asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground"
                          aria-label={`Reorder ${getColumnLabel(column)} column`}
                        >
                          <GripVertical className="size-4" />
                        </Button>
                      </SortableItemHandle>
                    </div>
                  </SortableItem>
                )
              })}
            </SortableContent>
          </Sortable>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              onClick={onResetView}
              disabled={disabled}
            >
              <RotateCcw className="size-3.5" />
              {t('ui.dataGrid.resetView', 'Reset view')}
            </Button>
          </div>

          {savedViews.length > 0 && (
            <div className="flex flex-col gap-1.5 border-t pt-2">
              <p className="font-medium text-sm">
                {t('ui.dataGrid.savedViews', 'Saved views')}
              </p>
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {savedViews.map((view) => (
                  <div
                    key={view.id}
                    className="flex items-center gap-1 rounded-sm border px-1 py-0.5"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 min-w-0 flex-1 justify-start px-1.5"
                      onClick={() => onApplyView(view)}
                    >
                      <span className="truncate text-sm">{view.name}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => onViewDelete(view.id)}
                      aria-label={t(
                        'ui.dataGrid.deleteViewLabel',
                        'Delete view',
                      ).replace('{name}', view.name)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
