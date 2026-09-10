'use client'

// @ts-nocheck
/* eslint-disable */
import { type CSSProperties } from 'react'

import { cn } from '@/lib/utils'

import {
  type AdaptiveCardSelectAction,
  type AdaptiveCardHorizontalAlignment,
  type AdaptiveCardTable,
  type AdaptiveCardTableCell,
  type AdaptiveCardTableRow,
  type AdaptiveCardVerticalAlignment,
} from '../adaptive-card-types'

import { useAdaptiveCardContext } from '../adaptive-card-context'
import { ElementList } from '../element-node'
import { getContainerStyleClass } from '../lib/color-tokens'
import { HORIZONTAL_ALIGN_CLASS, VERTICAL_FLEX_CLASS } from '../lib/size-tokens'

function dispatchSelect(
  ctx: ReturnType<typeof useAdaptiveCardContext>,
  action: AdaptiveCardSelectAction,
): void {
  if (action.type === 'Action.OpenUrl') ctx.openUrl(action)
  else if (action.type === 'Action.Submit') ctx.submit(action)
  else if (action.type === 'Action.Execute') ctx.execute(action)
  else if (action.type === 'Action.ToggleVisibility')
    ctx.toggleVisibility(action)
  else if (action.type === 'Action.ResetInputs') ctx.resetInputs(action)
}

function Cell({
  cell,
  isHeader,
  rowAlignH,
  rowAlignV,
  tableAlignH,
  tableAlignV,
  showGridLines,
  gridStyle,
}: {
  cell: AdaptiveCardTableCell
  isHeader: boolean
  rowAlignH?: AdaptiveCardHorizontalAlignment
  rowAlignV?: AdaptiveCardVerticalAlignment
  tableAlignH?: AdaptiveCardHorizontalAlignment
  tableAlignV?: AdaptiveCardVerticalAlignment
  showGridLines: boolean
  gridStyle: string
}) {
  const ctx = useAdaptiveCardContext()
  const Tag = isHeader ? 'th' : 'td'
  const styleClass = getContainerStyleClass(cell.style)
  const horizontal = rowAlignH ?? tableAlignH ?? 'left'
  const vertical =
    cell.verticalContentAlignment ?? rowAlignV ?? tableAlignV ?? 'top'

  const inner = (
    <div className={cn('flex flex-col', VERTICAL_FLEX_CLASS[vertical])}>
      <ElementList items={cell.items} />
    </div>
  )

  const { selectAction } = cell
  const cellContent = selectAction ? (
    <div
      role="button"
      tabIndex={0}
      aria-label={selectAction.title}
      className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => dispatchSelect(ctx, selectAction)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          dispatchSelect(ctx, selectAction)
        }
      }}
    >
      {inner}
    </div>
  ) : (
    inner
  )

  return (
    <Tag
      className={cn(
        'align-top p-2 text-sm',
        HORIZONTAL_ALIGN_CLASS[horizontal],
        styleClass,
        showGridLines ? `border ${gridStyle}` : '',
      )}
    >
      {cellContent}
    </Tag>
  )
}

function Row({
  row,
  isHeader,
  table,
}: {
  row: AdaptiveCardTableRow
  isHeader: boolean
  table: AdaptiveCardTable
}) {
  const styleClass = getContainerStyleClass(row.style)
  const showGridLines = table.showGridLines !== false
  const gridStyle =
    table.gridStyle === 'accent' ? 'border-primary/40' : 'border-border'

  return (
    <tr className={cn(styleClass)}>
      {row.cells.map((cell, idx) => (
        <Cell
          // eslint-disable-next-line @eslint-react/no-array-index-key -- table cells are a fixed positional array with no stable id
          key={idx}
          cell={cell}
          isHeader={isHeader}
          rowAlignH={row.horizontalCellContentAlignment}
          rowAlignV={row.verticalCellContentAlignment}
          tableAlignH={table.horizontalCellContentAlignment}
          tableAlignV={table.verticalCellContentAlignment}
          showGridLines={showGridLines}
          gridStyle={gridStyle}
        />
      ))}
    </tr>
  )
}

export function TableElement({ element }: { element: AdaptiveCardTable }) {
  const rows = element.rows ?? []
  const firstRowAsHeader = element.firstRowAsHeader !== false
  const showGridLines = element.showGridLines !== false

  const headerRow = firstRowAsHeader && rows.length > 0 ? rows[0] : null
  const bodyRows = headerRow ? rows.slice(1) : rows

  return (
    <div className="overflow-x-auto">
      <table
        className={cn(
          'w-full border-collapse text-sm',
          showGridLines ? 'border border-border' : '',
        )}
      >
        {element.columns && element.columns.length > 0 ? (
          <colgroup>
            {element.columns.map((col, idx) => {
              const style: CSSProperties = {}

              if (typeof col.width === 'number') {
                style.width = `${col.width * 50}px`
              } else if (
                typeof col.width === 'string' &&
                /^\d+px$/.test(col.width)
              ) {
                style.width = col.width
              }

              /* Columns are a fixed positional array with no stable id. */
              // eslint-disable-next-line @eslint-react/no-array-index-key -- positional table columns
              return <col key={`col-${idx}`} style={style} />
            })}
          </colgroup>
        ) : null}
        {headerRow ? (
          <thead>
            <Row row={headerRow} isHeader table={element} />
          </thead>
        ) : null}
        <tbody>
          {bodyRows.map((row, idx) => (
            // eslint-disable-next-line @eslint-react/no-array-index-key -- table rows are a fixed positional array with no stable id
            <Row key={idx} row={row} isHeader={false} table={element} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
