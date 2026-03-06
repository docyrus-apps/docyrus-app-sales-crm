// @ts-nocheck
import type { TSuggestionText } from 'platejs'
import type { SlateLeafProps } from 'platejs/static'

import { SlateLeaf } from 'platejs/static'

import { cn } from '@/lib/utils'

export function SuggestionLeafStatic(props: SlateLeafProps<TSuggestionText>) {
  return (
    <SlateLeaf
      {...props}
      className={cn('bg-emerald-100 text-emerald-700 no-underline')}
    >
      {props.children}
    </SlateLeaf>
  )
}
