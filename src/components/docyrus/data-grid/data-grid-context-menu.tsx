'use client'

import {
  memo,
  useCallback,
  useMemo,
  type CSSProperties,
  type ComponentProps,
} from 'react'

import { type ColumnDef, type TableMeta } from '@tanstack/react-table'

import { toast } from 'sonner'
import { CopyIcon, EraserIcon, ScissorsIcon, Trash2Icon } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAsRef } from '@/hooks/use-as-ref'

import { useUiTranslation } from '@/lib/use-ui-translation'

import { type CellUpdate, type ContextMenuState } from './types'
import { parseCellKey } from './lib/data-grid'

interface DataGridContextMenuProps<TData> {
  tableMeta: TableMeta<TData>
  columns: Array<ColumnDef<TData>>
  contextMenu: ContextMenuState
}

export function DataGridContextMenu<TData>({
  tableMeta,
  columns,
  contextMenu,
}: DataGridContextMenuProps<TData>) {
  const onContextMenuOpenChange = tableMeta?.onContextMenuOpenChange
  const selectionState = tableMeta?.selectionState
  const dataGridRef = tableMeta?.dataGridRef
  const onDataUpdate = tableMeta?.onDataUpdate
  const onRowsDelete = tableMeta?.onRowsDelete
  const onCellsCopy = tableMeta?.onCellsCopy
  const onCellsCut = tableMeta?.onCellsCut

  if (!contextMenu.open) return null

  return (
    <ContextMenu
      tableMeta={tableMeta}
      columns={columns}
      dataGridRef={dataGridRef}
      contextMenu={contextMenu}
      onContextMenuOpenChange={onContextMenuOpenChange}
      selectionState={selectionState}
      onDataUpdate={onDataUpdate}
      onRowsDelete={onRowsDelete}
      onCellsCopy={onCellsCopy}
      onCellsCut={onCellsCut}
    />
  )
}

interface ContextMenuProps<TData>
  extends
    Pick<
      TableMeta<TData>,
      | 'dataGridRef'
      | 'onContextMenuOpenChange'
      | 'selectionState'
      | 'onDataUpdate'
      | 'onRowsDelete'
      | 'onCellsCopy'
      | 'onCellsCut'
      | 'readOnly'
    >,
    Required<Pick<TableMeta<TData>, 'contextMenu'>> {
  tableMeta: TableMeta<TData>
  columns: Array<ColumnDef<TData>>
}

const ContextMenu = memo(ContextMenuImpl, (prev, next) => {
  if (prev.contextMenu.open !== next.contextMenu.open) return false
  if (!next.contextMenu.open) return true
  if (prev.contextMenu.x !== next.contextMenu.x) return false
  if (prev.contextMenu.y !== next.contextMenu.y) return false

  const prevSize = prev.selectionState?.selectedCells?.size ?? 0
  const nextSize = next.selectionState?.selectedCells?.size ?? 0

  if (prevSize !== nextSize) return false

  return true
}) as typeof ContextMenuImpl

function ContextMenuImpl<TData>({
  tableMeta,
  columns,
  dataGridRef,
  contextMenu,
  onContextMenuOpenChange,
  selectionState,
  onDataUpdate,
  onRowsDelete,
  onCellsCopy,
  onCellsCut,
}: ContextMenuProps<TData>) {
  const { t } = useUiTranslation()

  const propsRef = useAsRef({
    dataGridRef,
    selectionState,
    onDataUpdate,
    onRowsDelete,
    onCellsCopy,
    onCellsCut,
    columns,
  })

  const triggerStyle = useMemo<CSSProperties>(
    () => ({
      position: 'fixed',
      left: `${contextMenu.x}px`,
      top: `${contextMenu.y}px`,
      width: '1px',
      height: '1px',
      padding: 0,
      margin: 0,
      border: 'none',
      background: 'transparent',
      pointerEvents: 'none',
      opacity: 0,
    }),
    [contextMenu.x, contextMenu.y],
  )

  const onCloseAutoFocus: NonNullable<
    ComponentProps<typeof DropdownMenuContent>['onCloseAutoFocus']
  > = useCallback(
    (event) => {
      event.preventDefault()
      propsRef.current.dataGridRef?.current?.focus()
    },
    [propsRef],
  )

  const onCopy = useCallback(() => {
    propsRef.current.onCellsCopy?.()
  }, [propsRef])

  const onCut = useCallback(() => {
    propsRef.current.onCellsCut?.()
  }, [propsRef])

  const onClear = useCallback(() => {
    const { selectionState, columns, onDataUpdate } = propsRef.current

    if (
      !selectionState?.selectedCells ||
      selectionState.selectedCells.size === 0
    )
      return

    const updates: Array<CellUpdate> = []

    for (const cellKey of selectionState.selectedCells) {
      const { rowIndex, columnId } = parseCellKey(cellKey)

      const column = columns.find((col) => {
        if (col.id) return col.id === columnId
        if ('accessorKey' in col) return col.accessorKey === columnId

        return false
      })
      const cellVariant = column?.meta?.cell?.variant

      let emptyValue: unknown = ''

      if (cellVariant === 'multi-select' || cellVariant === 'file') {
        emptyValue = []
      } else if (cellVariant === 'number' || cellVariant === 'date') {
        emptyValue = null
      } else if (cellVariant === 'checkbox') {
        emptyValue = false
      }

      updates.push({ rowIndex, columnId, value: emptyValue })
    }

    onDataUpdate?.(updates)

    toast.success(
      `${updates.length} ${t('ui.dataGrid.cellsCleared', 'cells cleared')}`,
    )
  }, [propsRef, t])

  const onDelete = useCallback(async () => {
    const { selectionState, onRowsDelete } = propsRef.current

    if (
      !selectionState?.selectedCells ||
      selectionState.selectedCells.size === 0
    )
      return

    const rowIndices = new Set<number>()

    for (const cellKey of selectionState.selectedCells) {
      const { rowIndex } = parseCellKey(cellKey)

      rowIndices.add(rowIndex)
    }

    const rowIndicesArray = Array.from(rowIndices).sort((a, b) => a - b)
    const rowCount = rowIndicesArray.length

    await onRowsDelete?.(rowIndicesArray)

    toast.success(`${rowCount} ${t('ui.dataGrid.rowsDeleted', 'rows deleted')}`)
  }, [propsRef, t])

  return (
    <DropdownMenu
      open={contextMenu.open}
      onOpenChange={onContextMenuOpenChange}
    >
      <DropdownMenuTrigger style={triggerStyle} />
      <DropdownMenuContent
        data-grid-popover=""
        align="start"
        className="w-48"
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <DropdownMenuItem onSelect={onCopy}>
          <CopyIcon />
          {t('ui.dataGrid.contextMenuCopy', 'Copy')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onCut} disabled={tableMeta?.readOnly}>
          <ScissorsIcon />
          {t('ui.dataGrid.contextMenuCut', 'Cut')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onClear} disabled={tableMeta?.readOnly}>
          <EraserIcon />
          {t('ui.dataGrid.contextMenuClear', 'Clear')}
        </DropdownMenuItem>
        {onRowsDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2Icon />
              {t('ui.dataGrid.contextMenuDeleteRows', 'Delete rows')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
