'use client'

// @ts-nocheck
/* eslint-disable */
import { cn } from '@/lib/utils'

import { type AdaptiveCardCodeBlock } from '../adaptive-card-types'

export function CodeBlockElement({
  element,
}: {
  element: AdaptiveCardCodeBlock
}) {
  const code = element.codeSnippet ?? ''
  const start = element.startLineNumber ?? 1
  const lines = code.split('\n')

  return (
    <pre
      className={cn(
        'overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed',
        'font-mono',
      )}
      data-ac-language={element.language}
    >
      <code className="block">
        {lines.length > 1 ? (
          lines.map((line, idx) => (
            // eslint-disable-next-line @eslint-react/no-array-index-key -- source lines are a static, ordered split with no stable id
            <span
              key={`${start}-${idx}`}
              className="grid grid-cols-[3ch_1fr] gap-3"
            >
              <span className="select-none text-muted-foreground/60">
                {start + idx}
              </span>
              <span>{line || ' '}</span>
            </span>
          ))
        ) : (
          <span>{code}</span>
        )}
      </code>
    </pre>
  )
}
