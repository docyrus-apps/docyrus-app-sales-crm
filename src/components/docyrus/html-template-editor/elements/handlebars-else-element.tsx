'use client';

// @ts-nocheck
/* eslint-disable */
import { type MouseEvent, type PointerEvent } from 'react';

import {
  type PlateElementProps, PlateElement, useFocused, useSelected
} from 'platejs/react';

import { cn } from '@/lib/utils';

import { type THandlebarsElseElement } from '../types';

export function HandlebarsElseElement(
  props: PlateElementProps<THandlebarsElseElement>
) {
  const { children } = props;
  const selected = useSelected();
  const focused = useFocused();

  return (
    <PlateElement
      {...props}
      as="span"
      attributes={{
        ...props.attributes,
        contentEditable: false,
        draggable: true,
        title: '{{else}}',
        'data-hbs-marker': 'else',
        /*
         * Stop pointer events from bubbling so Plate's table cell-selection
         * floating toolbar doesn't pop up on chip click. Matches the guard
         * on the block-open chip.
         */
        onMouseDown: (e: MouseEvent) => e.stopPropagation(),
        onPointerDown: (e: PointerEvent) => e.stopPropagation()
      }}
      className={cn(
        'relative inline-flex cursor-default select-none items-center',
        'mx-0.5 rounded-md border border-dashed px-2 py-0 align-middle text-xs font-mono',
        'border-amber-300 bg-amber-50/80 text-amber-700',
        'dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
        'transition-colors',
        selected && focused && 'ring-2 ring-ring ring-offset-1'
      )}>
      {children}
      <span aria-hidden="true">
        <span className="opacity-60">{'{{'}</span>
        <span className="font-medium">else</span>
        <span className="opacity-60">{'}}'}</span>
      </span>
    </PlateElement>
  );
}