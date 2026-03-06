// @ts-nocheck
import type { SlateElementProps } from 'platejs/static'

import { SlateElement } from 'platejs/static'

export function AudioElementStatic(props: SlateElementProps) {
  const { element } = props
  const { url } = element as any

  return (
    <SlateElement {...props} className="py-2.5">
      <div className="flex justify-center">
        <audio className="w-full" src={url} controls />
      </div>
      {props.children}
    </SlateElement>
  )
}
