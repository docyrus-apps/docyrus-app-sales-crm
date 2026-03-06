// @ts-nocheck
import type { SlateElementProps } from 'platejs/static'

import { SlateElement } from 'platejs/static'

export function ToggleElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props} className="pl-6">
      {props.children}
    </SlateElement>
  )
}
