// @ts-nocheck
/* eslint-disable */
import { type CSSProperties, type ReactNode, type RefObject } from 'react'

import { type Column, type Table } from '@tanstack/react-table'

import {
  BaselineIcon,
  CalendarIcon,
  CheckSquareIcon,
  Clock3Icon,
  DollarSignIcon,
  File,
  FileArchive,
  FileAudio,
  FileIcon,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  FingerprintIcon,
  HashIcon,
  Link2Icon,
  LinkIcon,
  ListChecksIcon,
  ListIcon,
  MailIcon,
  PercentIcon,
  PhoneIcon,
  Presentation,
  TextInitialIcon,
  UserIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react'

import {
  type CellOpts,
  type CellPosition,
  type Direction,
  type FileCellData,
  type RowHeightValue,
} from '../types'

export function flexRender<TProps extends object>(
  Comp: ((props: TProps) => ReactNode) | string | undefined,
  props: TProps,
): ReactNode {
  if (typeof Comp === 'string') {
    return Comp
  }

  return Comp?.(props)
}

export function getIsFileCellData(item: unknown): item is FileCellData {
  return (
    !!item &&
    typeof item === 'object' &&
    'id' in item &&
    'name' in item &&
    'size' in item &&
    'type' in item
  )
}

export function matchSelectOption(
  value: string,
  options: Array<{ value: string; label: string }>,
): string | undefined {
  return options.find(
    (o) =>
      o.value === value ||
      o.value.toLowerCase() === value.toLowerCase() ||
      o.label.toLowerCase() === value.toLowerCase(),
  )?.value
}

export function getCellKey(rowIndex: number, columnId: string) {
  return `${rowIndex}:${columnId}`
}

export function parseCellKey(cellKey: string): Required<CellPosition> {
  const parts = cellKey.split(':')
  const rowIndexStr = parts[0]
  const columnId = parts[1]

  if (rowIndexStr && columnId) {
    const rowIndex = parseInt(rowIndexStr, 10)

    if (!Number.isNaN(rowIndex)) {
      return { rowIndex, columnId }
    }
  }

  return { rowIndex: 0, columnId: '' }
}

/**
 * Row heights in `rem` so the grid scales with `html { font-size }` — the
 * standard Tailwind v4 density knob. Pixel values for the consumer are
 * computed at render time by multiplying with the current root font size.
 */
const ROW_HEIGHT_REM: Record<RowHeightValue, number> = {
  short: 2.25, // 36 / 16
  medium: 3.5, // 56 / 16
  tall: 4.75, // 76 / 16
  'extra-tall': 6, // 96 / 16
}

const DEFAULT_ROOT_FONT_SIZE_PX = 16

/*
 * `getComputedStyle(document.documentElement)` forces a synchronous layout
 * read, so calling it from within a row's render path (where it gets invoked
 * once per visible row per virtualizer tick) ends up triggering 30–50+
 * forced reflows per scroll frame. We cache the value and invalidate it on
 * `resize` (browser zoom/font-size changes fire it) instead of paying the
 * layout cost on every render.
 */
let cachedRootFontSizePx: number | null = null
let rootFontSizeListenerInstalled = false

function readRootFontSizePx(): number {
  const parsed = parseFloat(getComputedStyle(document.documentElement).fontSize)

  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_ROOT_FONT_SIZE_PX
}

function getRootFontSizePx(): number {
  if (typeof document === 'undefined') return DEFAULT_ROOT_FONT_SIZE_PX

  if (cachedRootFontSizePx !== null) return cachedRootFontSizePx

  cachedRootFontSizePx = readRootFontSizePx()

  if (!rootFontSizeListenerInstalled && typeof window !== 'undefined') {
    rootFontSizeListenerInstalled = true
    window.addEventListener(
      'resize',
      () => {
        cachedRootFontSizePx = null
      },
      { passive: true },
    )
  }

  return cachedRootFontSizePx
}

/**
 * Coerce an arbitrary value into a valid `RowHeightValue`. Saved views (and
 * older persisted state) can carry a stale or foreign key here — e.g. the
 * gallery's `density: 'comfortable'` accidentally landing in `rowHeight`.
 * An unknown key would index `ROW_HEIGHT_REM`/`lineCountMap` as `undefined`,
 * and `undefined * fontSize` is `NaN`, which then poisons the virtualizer's
 * `estimateSize` → `getTotalSize()` returns `NaN`, the grid body collapses to
 * `height: NaNpx` (0), and every row renders invisibly. Clamping unknown keys
 * back to `'short'` keeps a corrupt view recoverable instead of blank.
 */
const VALID_ROW_HEIGHTS = new Set<RowHeightValue>([
  'short',
  'medium',
  'tall',
  'extra-tall',
])

export function normalizeRowHeight(rowHeight: unknown): RowHeightValue {
  if (VALID_ROW_HEIGHTS.has(rowHeight as RowHeightValue)) {
    return rowHeight as RowHeightValue
  }

  return 'short'
}

export function getRowHeightValue(rowHeight: RowHeightValue): number {
  return ROW_HEIGHT_REM[normalizeRowHeight(rowHeight)] * getRootFontSizePx()
}

export function getLineCount(rowHeight: RowHeightValue): number {
  const lineCountMap: Record<RowHeightValue, number> = {
    short: 1,
    medium: 2,
    tall: 3,
    'extra-tall': 4,
  }

  return lineCountMap[normalizeRowHeight(rowHeight)]
}

export function getColumnBorderVisibility<TData>(params: {
  column: Column<TData>
  nextColumn?: Column<TData>
  isLastColumn: boolean
}): {
  showEndBorder: boolean
  showStartBorder: boolean
} {
  const { column, nextColumn, isLastColumn } = params

  const isPinned = column.getIsPinned()
  const isFirstRightPinnedColumn =
    isPinned === 'right' && column.getIsFirstColumn('right')
  const isLastRightPinnedColumn =
    isPinned === 'right' && column.getIsLastColumn('right')

  const nextIsPinned = nextColumn?.getIsPinned()
  const isBeforeRightPinned =
    nextIsPinned === 'right' && nextColumn?.getIsFirstColumn('right')

  const showEndBorder =
    !isBeforeRightPinned && (isLastColumn || !isLastRightPinnedColumn)

  const showStartBorder = isFirstRightPinnedColumn

  return {
    showEndBorder,
    showStartBorder,
  }
}

export function getColumnPinningStyle<TData>(params: {
  column: Column<TData>
  withBorder?: boolean
  dir?: Direction
  background?: string
}): CSSProperties {
  const {
    column,
    dir = 'ltr',
    withBorder = false,
    background = 'var(--background)',
  } = params

  const isPinned = column.getIsPinned()
  const isLastLeftPinnedColumn =
    isPinned === 'left' && column.getIsLastColumn('left')
  const isFirstRightPinnedColumn =
    isPinned === 'right' && column.getIsFirstColumn('right')

  const isRtl = dir === 'rtl'

  const leftPosition =
    isPinned === 'left' ? `${column.getStart('left')}px` : undefined
  const rightPosition =
    isPinned === 'right' ? `${column.getAfter('right')}px` : undefined

  if (!isPinned) return {}

  return {
    boxShadow: withBorder
      ? isLastLeftPinnedColumn
        ? isRtl
          ? '4px 0 4px -4px var(--border) inset'
          : '-4px 0 4px -4px var(--border) inset'
        : isFirstRightPinnedColumn
          ? isRtl
            ? '-4px 0 4px -4px var(--border) inset'
            : '4px 0 4px -4px var(--border) inset'
          : undefined
      : undefined,
    left: isRtl ? rightPosition : leftPosition,
    right: isRtl ? leftPosition : rightPosition,
    opacity: 0.97,
    position: 'sticky',
    background,
    width: column.getSize(),
    zIndex: 1,
  }
}

export function getScrollDirection(
  direction: string,
): 'left' | 'right' | 'home' | 'end' | undefined {
  if (
    direction === 'left' ||
    direction === 'right' ||
    direction === 'home' ||
    direction === 'end'
  ) {
    return direction
  }
  if (direction === 'pageleft') return 'left'
  if (direction === 'pageright') return 'right'

  return undefined
}

export function scrollCellIntoView<TData>(params: {
  container: HTMLDivElement
  targetCell: HTMLDivElement
  tableRef: RefObject<Table<TData> | null>
  viewportOffset: number
  direction?: 'left' | 'right' | 'home' | 'end'
  isRtl: boolean
}): void {
  const { container, targetCell, tableRef, direction, viewportOffset, isRtl } =
    params

  const containerRect = container.getBoundingClientRect()
  const cellRect = targetCell.getBoundingClientRect()

  const hasNegativeScroll = container.scrollLeft < 0
  const isActuallyRtl = isRtl || hasNegativeScroll

  const currentTable = tableRef.current
  const leftPinnedColumns = currentTable?.getLeftVisibleLeafColumns() ?? []
  const rightPinnedColumns = currentTable?.getRightVisibleLeafColumns() ?? []

  const leftPinnedWidth = leftPinnedColumns.reduce(
    (sum, c) => sum + c.getSize(),
    0,
  )
  const rightPinnedWidth = rightPinnedColumns.reduce(
    (sum, c) => sum + c.getSize(),
    0,
  )

  const viewportLeft = isActuallyRtl
    ? containerRect.left + rightPinnedWidth + viewportOffset
    : containerRect.left + leftPinnedWidth + viewportOffset
  const viewportRight = isActuallyRtl
    ? containerRect.right - leftPinnedWidth - viewportOffset
    : containerRect.right - rightPinnedWidth - viewportOffset

  const isFullyVisible =
    cellRect.left >= viewportLeft && cellRect.right <= viewportRight

  if (isFullyVisible) return

  const isClippedLeft = cellRect.left < viewportLeft
  const isClippedRight = cellRect.right > viewportRight

  let scrollDelta = 0

  if (!direction) {
    if (isClippedRight) {
      scrollDelta = cellRect.right - viewportRight
    } else if (isClippedLeft) {
      scrollDelta = -(viewportLeft - cellRect.left)
    }
  } else {
    const shouldScrollRight = isActuallyRtl
      ? direction === 'right' || direction === 'home'
      : direction === 'right' || direction === 'end'

    if (shouldScrollRight) {
      scrollDelta = cellRect.right - viewportRight
    } else {
      scrollDelta = -(viewportLeft - cellRect.left)
    }
  }

  container.scrollLeft += scrollDelta
}

export function getIsInPopover(element: unknown): boolean {
  return (
    element instanceof Element &&
    (element.closest('[data-grid-cell-editor]') ||
      element.closest('[data-grid-popover]') ||
      element.closest('[data-radix-popper-content-wrapper]') ||
      element.closest('[data-radix-dialog-overlay]')) !== null
  )
}

export function getColumnVariant(variant?: CellOpts['variant']): {
  icon: LucideIcon
  label: string
} | null {
  switch (variant) {
    case 'short-text':
      return { label: 'Short text', icon: BaselineIcon }

    case 'long-text':
      return { label: 'Long text', icon: TextInitialIcon }

    case 'email':
      return { label: 'Email', icon: MailIcon }

    case 'phone':
      return { label: 'Phone', icon: PhoneIcon }

    case 'number':
      return { label: 'Number', icon: HashIcon }

    case 'currency':
      return { label: 'Currency', icon: DollarSignIcon }

    case 'percent':
      return { label: 'Percent', icon: PercentIcon }

    case 'url':
      return { label: 'URL', icon: LinkIcon }

    case 'checkbox':
      return { label: 'Checkbox', icon: CheckSquareIcon }

    case 'select':
      return { label: 'Select', icon: ListIcon }

    case 'status':
      return { label: 'Status', icon: CheckSquareIcon }

    case 'enum':
      return { label: 'Enum', icon: ListIcon }

    case 'multi-select':
      return { label: 'Multi-select', icon: ListChecksIcon }

    case 'date':
      return { label: 'Date', icon: CalendarIcon }

    case 'datetime':
      return { label: 'Date & time', icon: Clock3Icon }

    case 'file':
      return { label: 'File', icon: FileIcon }

    case 'user':
      return { label: 'User', icon: UserIcon }

    case 'user-multi-select':
      return { label: 'Users', icon: UsersIcon }

    case 'relation':
      return { label: 'Relation', icon: Link2Icon }

    case 'uuid':
      return { label: 'UUID', icon: FingerprintIcon }

    default:
      return null
  }
}

export function getEmptyCellValue(
  variant: CellOpts['variant'] | undefined,
): unknown {
  if (variant === 'multi-select' || variant === 'file') return []
  if (
    variant === 'number' ||
    variant === 'currency' ||
    variant === 'percent' ||
    variant === 'date' ||
    variant === 'datetime'
  ) {
    return null
  }
  if (variant === 'checkbox') return false

  return ''
}

export function getUrlHref(urlString: string): string {
  if (!urlString || urlString.trim() === '') return ''

  const trimmed = urlString.trim()

  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
    return ''
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  return `http://${trimmed}`
}

export function parseLocalDate(dateStr: unknown): Date | null {
  if (!dateStr) return null
  if (dateStr instanceof Date) return dateStr
  if (typeof dateStr !== 'string') return null

  const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
  const [year, month, day] = (datePart ?? '').split('-').map(Number)

  if (!year || !month || !day) return null
  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

export function formatDateToString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function formatDateForDisplay(dateStr: unknown): string {
  if (!dateStr) return ''

  return typeof dateStr === 'string' ? dateStr : String(dateStr)
}

export function formatFileSize(bytes: number): string {
  if (bytes <= 0 || !Number.isFinite(bytes)) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(
    sizes.length - 1,
    Math.floor(Math.log(bytes) / Math.log(k)),
  )

  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`
}

export function getFileIcon(type: string): LucideIcon {
  if (type.startsWith('image/')) return FileImage
  if (type.startsWith('video/')) return FileVideo
  if (type.startsWith('audio/')) return FileAudio
  if (type.includes('pdf')) return FileText
  if (type.includes('zip') || type.includes('rar')) return FileArchive
  if (
    type.includes('word') ||
    type.includes('document') ||
    type.includes('doc')
  )
    return FileText
  if (type.includes('sheet') || type.includes('excel') || type.includes('xls'))
    return FileSpreadsheet
  if (
    type.includes('presentation') ||
    type.includes('powerpoint') ||
    type.includes('ppt')
  )
    return Presentation

  return File
}
