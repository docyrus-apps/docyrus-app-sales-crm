'use client'

import { useMemo, type ComponentProps } from 'react'

import { type Table } from '@tanstack/react-table'

import {
  AlignVerticalSpaceAroundIcon,
  ChevronsDownUpIcon,
  EqualIcon,
  MinusIcon,
} from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const rowHeights = [
  {
    label: 'Short',
    value: 'short' as const,
    icon: MinusIcon,
  },
  {
    label: 'Medium',
    value: 'medium' as const,
    icon: EqualIcon,
  },
  {
    label: 'Tall',
    value: 'tall' as const,
    icon: AlignVerticalSpaceAroundIcon,
  },
  {
    label: 'Extra Tall',
    value: 'extra-tall' as const,
    icon: ChevronsDownUpIcon,
  },
] as const

interface DataGridRowHeightMenuProps<TData> extends ComponentProps<
  typeof SelectContent
> {
  table: Table<TData>
  disabled?: boolean
}

export function DataGridRowHeightMenu<TData>({
  table,
  disabled,
  ...props
}: DataGridRowHeightMenuProps<TData>) {
  const rowHeight = table.options.meta?.rowHeight
  const onRowHeightChange = table.options.meta?.onRowHeightChange

  const selectedRowHeight = useMemo(() => {
    return (
      rowHeights.find((opt) => opt.value === rowHeight) ?? {
        label: 'Short',
        value: 'short' as const,
        icon: MinusIcon,
      }
    )
  }, [rowHeight])

  return (
    <Select
      value={rowHeight}
      onValueChange={onRowHeightChange}
      disabled={disabled}
    >
      <SelectTrigger
        size="sm"
        className="size-8 justify-center px-0 bg-background [&>svg]:hidden"
        aria-label="Row height"
      >
        <SelectValue placeholder="Row height">
          <selectedRowHeight.icon className="size-4" />
        </SelectValue>
      </SelectTrigger>
      <SelectContent {...props}>
        {rowHeights.map((option) => {
          const OptionIcon = option.icon

          return (
            <SelectItem key={option.value} value={option.value}>
              <OptionIcon className="size-4" />
              {option.label}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
