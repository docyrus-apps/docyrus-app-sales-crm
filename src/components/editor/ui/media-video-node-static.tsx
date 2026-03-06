// @ts-nocheck
import type { SlateElementProps } from 'platejs/static'

import { SlateElement } from 'platejs/static'

import { cn } from '@/lib/utils'

export function VideoElementStatic(props: SlateElementProps) {
  const { element } = props
  const { align = 'center', caption, url, width } = element as any

  return (
    <SlateElement {...props} className="py-2.5">
      <div
        className={cn(
          'flex',
          align === 'center' && 'justify-center',
          align === 'right' && 'justify-end',
        )}
      >
        <figure className="group relative m-0 inline-block" style={{ width }}>
          <video className="w-full rounded-sm" src={url} controls />
          {caption && (
            <figcaption className="mt-2 text-center text-muted-foreground text-sm">
              {(caption as any)?.[0]?.text}
            </figcaption>
          )}
        </figure>
      </div>
      {props.children}
    </SlateElement>
  )
}
