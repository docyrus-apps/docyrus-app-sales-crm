'use client'

// @ts-nocheck
/* eslint-disable */
import { type ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

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

export interface DataGridRowAction<TData> {
  key: string
  label: ReactNode
  icon?: ReactNode
  destructive?: boolean
  disabled?: boolean
  hidden?: boolean
  onSelect: (row: TData) => void | Promise<void>
}

interface DataGridRowActionsProps<TData> {
  row: TData
  openPageLabel: string
  actionsLabel: string
  onOpenPage: (row: TData) => void | Promise<void>
  actions?: Array<DataGridRowAction<TData>>
  className?: string
}

export function DataGridRowActions<TData>({
  row,
  openPageLabel,
  actionsLabel,
  onOpenPage,
  actions = [],
  className,
}: DataGridRowActionsProps<TData>) {
  const visibleActions = actions.filter((action) => !action.hidden)

  return (
    <div className={cn('flex items-center gap-0.5 px-1', className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label={openPageLabel}
        title={openPageLabel}
        onClick={() => {
          void onOpenPage(row)
        }}
      >
        <DocyrusIcon icon="huge square-arrow-expand-01" size="sm" />
      </Button>
      {visibleActions.length > 0 ? (
        /*
         * modal={false}: actions here navigate (view/detail). A modal menu
         * sets `pointer-events: none` on <body>; navigating from a menu item
         * unmounts the menu before Radix restores the style and the whole
         * app becomes unclickable until reload.
         */
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label={actionsLabel}
              title={actionsLabel}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {visibleActions.map((action, index) => {
              const showSeparator =
                action.destructive === true &&
                index > 0 &&
                visibleActions[index - 1].destructive !== true

              return (
                <Fragment key={action.key}>
                  {showSeparator ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuItem
                    disabled={action.disabled}
                    onClick={() => {
                      void action.onSelect(row)
                    }}
                    className={cn(
                      action.destructive &&
                        'text-destructive focus:text-destructive',
                    )}
                  >
                    {action.icon}
                    {action.label}
                  </DropdownMenuItem>
                </Fragment>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  )
}
