'use client'

// @ts-nocheck
/* eslint-disable */
import { useMemo, type ComponentProps } from 'react'

import { type Table } from '@tanstack/react-table'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'
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

const rowHeights: ReadonlyArray<{
  labelKey: string
  labelFallback: string
  value: 'short' | 'medium' | 'tall' | 'extra-tall'
  icon: typeof MinusIcon
}> = [
  {
    labelKey: 'ui.dataGrid.rowHeightShort',
    labelFallback: 'Short',
    value: 'short' as const,
    icon: MinusIcon,
  },
  {
    labelKey: 'ui.dataGrid.rowHeightMedium',
    labelFallback: 'Medium',
    value: 'medium' as const,
    icon: EqualIcon,
  },
  {
    labelKey: 'ui.dataGrid.rowHeightTall',
    labelFallback: 'Tall',
    value: 'tall' as const,
    icon: AlignVerticalSpaceAroundIcon,
  },
  {
    labelKey: 'ui.dataGrid.rowHeightExtraTall',
    labelFallback: 'Extra Tall',
    value: 'extra-tall' as const,
    icon: ChevronsDownUpIcon,
  },
]

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
  const { t } = useUiTranslation()
  const rowHeight = table.options.meta?.rowHeight
  const onRowHeightChange = table.options.meta?.onRowHeightChange

  const selectedRowHeight = useMemo(() => {
    return (
      rowHeights.find((opt) => opt.value === rowHeight) ?? {
        labelKey: 'ui.dataGrid.rowHeightShort',
        labelFallback: 'Short',
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
        aria-label={t('ui.dataGrid.rowHeight', 'Row height')}
      >
        <SelectValue placeholder={t('ui.dataGrid.rowHeight', 'Row height')}>
          <selectedRowHeight.icon className="size-4" />
        </SelectValue>
      </SelectTrigger>
      <SelectContent {...props}>
        {rowHeights.map((option) => {
          const OptionIcon = option.icon

          return (
            <SelectItem key={option.value} value={option.value}>
              <OptionIcon className="size-4" />
              {t(option.labelKey, option.labelFallback)}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
