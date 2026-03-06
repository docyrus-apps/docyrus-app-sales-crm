// @ts-nocheck
import type { TColumnElement } from 'platejs'
import type { SlateElementProps } from 'platejs/static'

import { SlateElement } from 'platejs/static'

export function ColumnElementStatic(props: SlateElementProps<TColumnElement>) {
  const { width } = props.element

  return (
    <div style={{ width: width ?? '100%' }}>
      <SlateElement {...props} className="h-full px-2 pt-2">
        <div className="relative h-full p-1.5">{props.children}</div>
      </SlateElement>
    </div>
  )
}

export function ColumnGroupElementStatic(props: SlateElementProps) {
  return (
    <SlateElement className="mb-2" {...props}>
      <div className="flex size-full rounded">{props.children}</div>
    </SlateElement>
  )
}
