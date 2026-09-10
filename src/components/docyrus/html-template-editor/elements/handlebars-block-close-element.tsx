'use client'

// @ts-nocheck
/* eslint-disable */
import { type MouseEvent, type PointerEvent } from 'react'

import {
  type PlateElementProps,
  PlateElement,
  useFocused,
  useSelected,
} from 'platejs/react'

import { cn } from '@/lib/utils'

import { type THandlebarsBlockCloseElement } from '../types'

const HELPER_COLORS: Record<string, string> = {
  if: 'border-amber-200 bg-amber-50/60 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
  unless:
    'border-orange-200 bg-orange-50/60 text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  each: 'border-green-200 bg-green-50/60 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400',
  with: 'border-purple-200 bg-purple-50/60 text-purple-700 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
}

const DEFAULT_HELPER_COLOR =
  'border-slate-200 bg-slate-50/60 text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400'

export function HandlebarsBlockCloseElement(
  props: PlateElementProps<THandlebarsBlockCloseElement>,
) {
  const { element, children } = props
  const selected = useSelected()
  const focused = useFocused()
  const colorClass = HELPER_COLORS[element.helper] ?? DEFAULT_HELPER_COLOR

  return (
    <PlateElement
      {...props}
      as="span"
      attributes={{
        ...props.attributes,
        contentEditable: false,
        draggable: true,
        title: `Block helper close: {{/${element.helper}}}`,
        'data-hbs-marker': 'block-close',
        /*
         * Stop pointer events from bubbling to the surrounding `<td>` /
         * `<tr>` so Plate's table cell-selection floating toolbar
         * doesn't pop up on chip click. Matches the guard on the
         * block-open chip — see that file for full reasoning.
         */
        onMouseDown: (e: MouseEvent) => e.stopPropagation(),
        onPointerDown: (e: PointerEvent) => e.stopPropagation(),
      }}
      className={cn(
        'relative inline-flex cursor-default select-none items-center',
        'mx-0.5 rounded-md border border-dashed px-2 py-0 align-middle text-xs font-mono',
        colorClass,
        'transition-colors',
        selected && focused && 'ring-2 ring-ring ring-offset-1',
      )}
    >
      {children}
      <span aria-hidden="true">
        <span className="opacity-60">{'{{/'}</span>
        <span className="font-medium">{element.helper}</span>
        <span className="opacity-60">{'}}'}</span>
      </span>
    </PlateElement>
  )
}
