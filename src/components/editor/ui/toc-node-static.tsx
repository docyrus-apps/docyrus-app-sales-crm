// @ts-nocheck
import type { SlateElementProps } from 'platejs/static'

import { SlateElement } from 'platejs/static'

export function TocElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props} className="mb-1 p-0">
      <div contentEditable={false}>
        <div className="text-gray-500 text-sm">Table of contents</div>
      </div>
      {props.children}
    </SlateElement>
  )
}
