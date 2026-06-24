'use client'

// @ts-nocheck
/* eslint-disable */
import {
  memo,
  useCallback,
  useMemo,
  type ComponentType,
  type MouseEvent,
} from 'react'

import { CalendarIcon, ChevronDownIcon, ChevronRightIcon } from 'lucide-react'

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import { cn } from '@/lib/utils'

import {
  type CellSelectOption,
  type CellUserOption,
  type DataGridCellProps,
} from './types'
import {
  type GroupableCellVariant,
  getGroupableCellVariant,
  resolveGroupHeaderPresentation,
} from './lib/data-grid-grouping'

import {
  ChartCell,
  CheckboxCell,
  ColorCell,
  CurrencyCell,
  CurrencyCodeCell,
  DateCell,
  DateRangeCell,
  DateTimeCell,
  DurationCell,
  EmailCell,
  EnumCell,
  FileCell,
  IconCell,
  ImageCell,
  LongTextCell,
  MultiSelectCell,
  NumberCell,
  PercentCell,
  PhoneCell,
  RatingCell,
  RelationCell,
  SelectCell,
  ShortTextCell,
  SwitchCell,
  TagSelectCell,
  TimeCell,
  UrlCell,
  UserCell,
  UserMultiSelectCell,
  UuidCell,
} from './data-grid-cell-variants'
import { DataGridCellWrapper } from './data-grid-cell-wrapper'

export const DataGridCell = memo(DataGridCellImpl, (prev, next) => {
  if (prev.isFocused !== next.isFocused) return false
  if (prev.isEditing !== next.isEditing) return false
  if (prev.isSelected !== next.isSelected) return false
  if (prev.isSearchMatch !== next.isSearchMatch) return false
  if (prev.isActiveSearchMatch !== next.isActiveSearchMatch) return false
  if (prev.isChanged !== next.isChanged) return false
  if (prev.readOnly !== next.readOnly) return false
  if (prev.colorRuleBg !== next.colorRuleBg) return false
  if (prev.rowIndex !== next.rowIndex) return false
  if (prev.columnId !== next.columnId) return false
  if (prev.rowHeight !== next.rowHeight) return false
  if (prev.cell.row.id !== next.cell.row.id) return false

  const prevIsGrouped = prev.cell.getIsGrouped()
  const nextIsGrouped = next.cell.getIsGrouped()

  if (prevIsGrouped !== nextIsGrouped) return false

  const prevIsPlaceholder = prev.cell.getIsPlaceholder()
  const nextIsPlaceholder = next.cell.getIsPlaceholder()

  if (prevIsPlaceholder !== nextIsPlaceholder) return false

  const prevIsAggregated = prev.cell.getIsAggregated()
  const nextIsAggregated = next.cell.getIsAggregated()

  if (prevIsAggregated !== nextIsAggregated) return false

  if (prevIsGrouped || nextIsGrouped) {
    if (
      (prev.cell.row.groupingColumnId ?? '') !==
      (next.cell.row.groupingColumnId ?? '')
    ) {
      return false
    }

    if (
      (prev.cell.row.groupingValue ?? '') !==
      (next.cell.row.groupingValue ?? '')
    ) {
      return false
    }

    if (prev.cell.row.getIsExpanded() !== next.cell.row.getIsExpanded()) {
      return false
    }

    if (prev.cell.row.subRows.length !== next.cell.row.subRows.length) {
      return false
    }

    if (prev.cell.getValue() !== next.cell.getValue()) {
      return false
    }

    return true
  }

  const prevValue = (prev.cell.row.original as Record<string, unknown>)[
    prev.columnId
  ]
  const nextValue = (next.cell.row.original as Record<string, unknown>)[
    next.columnId
  ]

  if (prevValue !== nextValue) {
    return false
  }

  /*
   * Per-column runtime overrides (e.g. relation `showAutonumber`) are
   * forwarded as an explicit prop by `DataGridRow`. The map entry is
   * replaced on every `setColumnOptions` call, so a reference check on
   * the prop catches the change. Reading `tableMeta.columnOptions` here
   * would not work — `tableMeta` is referentially stable and exposes the
   * map via a getter that returns the same current snapshot for both
   * `prev` and `next`.
   */
  if (prev.columnOption !== next.columnOption) {
    return false
  }

  return true
}) as typeof DataGridCellImpl

function DataGridCellImpl<TData>(props: DataGridCellProps<TData>) {
  const { cell } = props

  const isGroupedCell = cell.getIsGrouped()

  if (isGroupedCell) {
    return <GroupedHeaderCell {...props} />
  }

  /*
   * Aggregated cells (group-header rows, non-grouping columns) render as
   * empty since they belong to a header row that already shows the grouped
   * value. Placeholder cells (sub-rows of a grouped column) used to also
   * render empty, but consumers expect to still see the value next to each
   * row, so we let them fall through to the normal renderer below.
   */
  if (cell.getIsAggregated()) {
    return <GroupedReadOnlyCell {...props} />
  }

  const cellOpts = cell.column.columnDef.meta?.cell
  const variant = cellOpts?.variant ?? 'text'

  let Comp: ComponentType<DataGridCellProps<TData>>

  switch (variant) {
    case 'short-text':
      Comp = ShortTextCell
      break

    case 'long-text':
      Comp = LongTextCell
      break

    case 'email':
      Comp = EmailCell
      break

    case 'phone':
      Comp = PhoneCell
      break

    case 'number':
      Comp = NumberCell
      break

    case 'currency':
      Comp = CurrencyCell
      break

    case 'percent':
      Comp = PercentCell
      break

    case 'url':
      Comp = UrlCell
      break

    case 'checkbox':
      Comp = CheckboxCell
      break

    case 'select':

    case 'status':
      Comp = SelectCell
      break

    case 'enum':
      Comp = EnumCell
      break

    case 'user':
      Comp = UserCell
      break

    case 'multi-select':
      Comp = MultiSelectCell
      break

    case 'date':
      Comp = DateCell
      break

    case 'datetime':
      Comp = DateTimeCell
      break

    case 'file':
      Comp = FileCell
      break

    case 'switch':
      Comp = SwitchCell as ComponentType<DataGridCellProps<TData>>
      break

    case 'rating':
      Comp = RatingCell as ComponentType<DataGridCellProps<TData>>
      break

    case 'duration':
      Comp = DurationCell
      break

    case 'time':
      Comp = TimeCell
      break

    case 'date-range':
      Comp = DateRangeCell
      break

    case 'color':
      Comp = ColorCell
      break

    case 'icon':
      Comp = IconCell as ComponentType<DataGridCellProps<TData>>
      break

    case 'currency-code':
      Comp = CurrencyCodeCell
      break

    case 'image':
      Comp = ImageCell as ComponentType<DataGridCellProps<TData>>
      break

    case 'relation':
      Comp = RelationCell
      break

    case 'user-multi-select':
      Comp = UserMultiSelectCell
      break

    case 'tag-select':
      Comp = TagSelectCell
      break

    case 'chart':
      Comp = ChartCell as ComponentType<DataGridCellProps<TData>>
      break

    case 'uuid':
      Comp = UuidCell as ComponentType<DataGridCellProps<TData>>
      break

    default:
      Comp = ShortTextCell
      break
  }

  return <Comp {...props} />
}

function GroupedReadOnlyCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
}: DataGridCellProps<TData>) {
  return (
    <DataGridCellWrapper<TData>
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      isChanged={isChanged}
      readOnly
    >
      <span data-slot="grid-cell-content" className="text-muted-foreground" />
    </DataGridCellWrapper>
  )
}

function GroupedHeaderCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
}: DataGridCellProps<TData>) {
  const groupedRow = cell.row
  const groupingColumnId = groupedRow.groupingColumnId ?? columnId
  const groupingColumn = cell.getContext().table.getColumn(groupingColumnId)

  const groupingCellMeta = groupingColumn?.columnDef.meta?.cell

  const options: Array<CellSelectOption | CellUserOption> = useMemo(() => {
    if (groupingCellMeta?.variant === 'user') {
      return groupingCellMeta.options
    }

    if (groupingCellMeta?.variant === 'enum') {
      return groupingCellMeta.options ?? []
    }

    return []
  }, [groupingCellMeta])

  const canExpand = groupedRow.getCanExpand()

  const onToggleExpand = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()

      if (!canExpand) return
      groupedRow.toggleExpanded()
    },
    [canExpand, groupedRow],
  )

  if (!groupingColumn) {
    return (
      <GroupedReadOnlyCell
        cell={cell}
        tableMeta={tableMeta}
        rowIndex={rowIndex}
        columnId={columnId}
        rowHeight={rowHeight}
        isFocused={isFocused}
        isEditing={isEditing}
        isSelected={isSelected}
        isSearchMatch={isSearchMatch}
        isActiveSearchMatch={isActiveSearchMatch}
        isChanged={isChanged}
        readOnly
      />
    )
  }

  const variant = getGroupableCellVariant(groupingColumn.columnDef.meta?.cell)

  const rawValue = groupedRow.getValue(groupingColumnId)
  const firstSubRowValue = groupedRow.subRows[0]?.getValue(groupingColumnId)

  const presentation = variant
    ? resolveGroupHeaderPresentation({
        variant,
        groupingValue: groupedRow.groupingValue,
        rawValue: rawValue ?? firstSubRowValue,
        options,
      })
    : {
        label:
          typeof groupedRow.groupingValue === 'string'
            ? groupedRow.groupingValue
            : String(groupedRow.groupingValue ?? ''),
      }

  const renderGroupValue = groupingColumn.columnDef.meta?.renderGroupValue
  /*
   * `accessorFn` may have been used to normalize the value (e.g. extract `id`
   * from an expanded enum object). When a custom group-value renderer is
   * provided we want the original record-level value so the field's
   * value-renderer can use full metadata (label, color, avatar, ...).
   */
  const firstSubRowOriginal = groupedRow.subRows[0]?.original as
    | TData
    | undefined
  const originalGroupValue =
    firstSubRowOriginal &&
    groupingColumnId in (firstSubRowOriginal as Record<string, unknown>)
      ? (firstSubRowOriginal as Record<string, unknown>)[groupingColumnId]
      : (rawValue ?? firstSubRowValue)

  /*
   * date/datetime columns bucket by day, so the header must show the day key
   * (via the built-in presentation), NOT a custom value renderer fed the first
   * sub-row's arbitrary raw timestamp — that rendered an unrelated, UTC,
   * per-row time over a day group (issue #104, bug 1). Other variants
   * (enum/relation/user) keep the custom renderer for full metadata.
   */
  const isDateBucketVariant = variant === 'date' || variant === 'datetime'

  const childCount = groupedRow.subRows.length
  const isExpanded = groupedRow.getIsExpanded()

  return (
    <DataGridCellWrapper<TData>
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      isChanged={isChanged}
      readOnly
    >
      <button
        type="button"
        className={cn(
          'flex w-full items-center gap-2 rounded-sm px-0.5 py-0.5 text-left',
          canExpand && 'hover:bg-muted/40',
        )}
        onClick={onToggleExpand}
      >
        {canExpand ? (
          isExpanded ? (
            <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
          )
        ) : (
          <span className="inline-block size-4 shrink-0" />
        )}

        {renderGroupValue && !isDateBucketVariant ? (
          <span
            data-slot="grid-cell-content"
            className="flex min-w-0 flex-1 items-center gap-2 truncate font-medium"
            title={presentation.label}
          >
            {renderGroupValue({
              value: originalGroupValue,
              record: firstSubRowOriginal,
              groupingValue: groupedRow.groupingValue,
            })}
          </span>
        ) : (
          <>
            <GroupValueVisual variant={variant} presentation={presentation} />
            <span
              data-slot="grid-cell-content"
              className="truncate font-medium"
              title={presentation.label}
            >
              {presentation.label}
            </span>
          </>
        )}

        <span className="shrink-0 text-muted-foreground text-xs">
          ({childCount})
        </span>
      </button>
    </DataGridCellWrapper>
  )
}

function GroupValueVisual({
  variant,
  presentation,
}: {
  variant: GroupableCellVariant | null
  presentation: {
    label: string
    avatarUrl?: string
    imageUrl?: string
    iconStr?: string
    color?: string
  }
}) {
  if (variant === 'user') {
    return (
      <Avatar className="size-5 rounded-md">
        {presentation.avatarUrl ? (
          <AvatarImage src={presentation.avatarUrl} alt={presentation.label} />
        ) : null}
        <AvatarFallback className="rounded-md text-[10px] uppercase">
          {getInitials(presentation.label)}
        </AvatarFallback>
      </Avatar>
    )
  }

  if (variant === 'relation') {
    if (presentation.imageUrl) {
      return (
        <img
          src={presentation.imageUrl}
          alt={presentation.label}
          className="size-5 shrink-0 rounded object-cover"
        />
      )
    }

    if (presentation.iconStr) {
      return (
        <DocyrusIcon icon={presentation.iconStr} className="size-4 shrink-0" />
      )
    }

    if (presentation.color) {
      return (
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: presentation.color }}
        />
      )
    }
  }

  if (variant === 'enum') {
    if (presentation.iconStr) {
      return (
        <DocyrusIcon icon={presentation.iconStr} className="size-4 shrink-0" />
      )
    }

    if (presentation.color) {
      return (
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: presentation.color }}
        />
      )
    }
  }

  if (variant === 'date' || variant === 'datetime') {
    return <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
  }

  return null
}

function getInitials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) return 'U'

  if (parts.length === 1) {
    return parts[0]?.slice(0, 2).toUpperCase() ?? 'U'
  }

  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''

  return `${first}${last}`.toUpperCase() || 'U'
}
