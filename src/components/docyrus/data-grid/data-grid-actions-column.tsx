'use client'

import { type ColumnDef } from '@tanstack/react-table'

const BUTTON_SIZE = 28
const BUTTON_GAP = 2
const CELL_PADDING = 12

function getActionsColumnSize(actionCount: number): number {
  return (
    actionCount * BUTTON_SIZE +
    Math.max(0, actionCount - 1) * BUTTON_GAP +
    CELL_PADDING
  )
}

interface GetDataGridActionsColumnOptions<TData> extends Omit<
  Partial<ColumnDef<TData>>,
  'id' | 'header' | 'meta'
> {
  /** Number of inline action buttons. Used to auto-calculate column width when `size` is not provided. @default 2 */
  actionCount?: number
  /** Hide cell content on non-touch screens until the row is hovered. @default true */
  visibleOnHover?: boolean
}

export function getDataGridActionsColumn<TData>({
  actionCount = 2,
  visibleOnHover = true,
  size,
  enableHiding = false,
  enableResizing = false,
  enableSorting = false,
  ...props
}: GetDataGridActionsColumnOptions<TData> = {}): ColumnDef<TData> {
  const resolvedSize = size ?? getActionsColumnSize(actionCount)

  return {
    id: 'actions',
    header: () => null,
    size: resolvedSize,
    minSize: resolvedSize,
    enableHiding,
    enableResizing,
    enableSorting,
    ...(visibleOnHover && {
      meta: { visibleOnHover: true } as ColumnDef<TData>['meta'],
    }),
    ...props,
  }
}
