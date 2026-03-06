import type { ColumnDef } from '@tanstack/react-table'
import { EllipsisVertical, Eye, Pencil, Copy, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DataGridRowActionHandlers<TData> {
  onView: (row: TData) => void
  onEdit: (row: TData) => void
  onDuplicate: (row: TData) => void
  onDelete: (row: TData) => void
}

type DataGridRowActionColumnOptions<TData> =
  DataGridRowActionHandlers<TData> & {
    size?: number
    enableHiding?: boolean
    enableResizing?: boolean
    enableSorting?: boolean
  }

export function getDataGridRowActionsColumn<TData>({
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  size = 60,
  enableHiding = false,
  enableResizing = false,
  enableSorting = false,
  ...props
}: DataGridRowActionColumnOptions<TData>): ColumnDef<TData> {
  return {
    id: 'actions',
    header: () => null,
    size,
    enableHiding,
    enableResizing,
    enableSorting,
    cell: ({ row }) => {
      const record = row.original

      return (
        <div className="flex items-center justify-end gap-0.5 px-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="View"
            onClick={() => onView(record)}
          >
            <Eye className="size-3.5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Actions"
              >
                <EllipsisVertical className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEdit(record)}>
                <Pencil className="size-3.5" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(record)}>
                <Copy className="size-3.5" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(record)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
    ...props,
  }
}
