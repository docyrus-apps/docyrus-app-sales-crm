// @ts-nocheck
import type { SlateElementProps } from 'platejs/static'

import { SlateElement } from 'platejs/static'

export function FileElementStatic(props: SlateElementProps) {
  const { element } = props
  const { name, url } = element as any

  return (
    <SlateElement {...props} className="py-2.5">
      <div className="flex items-center gap-2 rounded-sm border p-3">
        <a
          className="font-medium text-primary underline underline-offset-4"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {name || url || 'File'}
        </a>
      </div>
      {props.children}
    </SlateElement>
  )
}
