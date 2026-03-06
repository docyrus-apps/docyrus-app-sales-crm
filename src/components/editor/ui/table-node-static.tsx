// @ts-nocheck
import type {
  TTableCellElement,
  TTableElement,
  TTableRowElement,
} from 'platejs'
import type { SlateElementProps } from 'platejs/static'

import { SlateElement } from 'platejs/static'

import { cn } from '@/lib/utils'

export function TableElementStatic(props: SlateElementProps<TTableElement>) {
  return (
    <SlateElement {...props} className="overflow-x-auto py-5">
      <div className="relative w-fit">
        <table className="mr-0 ml-px table h-px table-fixed border-collapse">
          <tbody className="min-w-full">{props.children}</tbody>
        </table>
      </div>
    </SlateElement>
  )
}

export function TableRowElementStatic(
  props: SlateElementProps<TTableRowElement>,
) {
  return (
    <SlateElement {...props} as="tr">
      {props.children}
    </SlateElement>
  )
}

export function TableCellElementStatic({
  isHeader,
  ...props
}: SlateElementProps<TTableCellElement> & {
  isHeader?: boolean
}) {
  const { element } = props

  return (
    <SlateElement
      {...props}
      as={isHeader ? 'th' : 'td'}
      className={cn(
        'h-full overflow-visible border-none p-0',
        element.background ? 'bg-(--cellBackground)' : 'bg-background',
        isHeader && 'text-left *:m-0',
        'before:size-full',
        "before:absolute before:box-border before:select-none before:content-['']",
        'before:border-b before:border-b-border',
        'before:border-r before:border-r-border',
        'before:border-l before:border-l-border',
        'before:border-t before:border-t-border',
      )}
      style={
        {
          '--cellBackground': element.background,
          maxWidth: (element as any).width || 240,
          minWidth: (element as any).width || 120,
        } as React.CSSProperties
      }
      attributes={{
        ...props.attributes,
        colSpan: (element as any).colSpan,
        rowSpan: (element as any).rowSpan,
      }}
    >
      <div className="relative z-20 box-border h-full px-3 py-2">
        {props.children}
      </div>
    </SlateElement>
  )
}

export function TableCellHeaderElementStatic(
  props: React.ComponentProps<typeof TableCellElementStatic>,
) {
  return <TableCellElementStatic {...props} isHeader />
}
