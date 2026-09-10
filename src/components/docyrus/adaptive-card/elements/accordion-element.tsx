'use client'

// @ts-nocheck
/* eslint-disable */
import { useMemo } from 'react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'

import {
  type AdaptiveCardAccordion,
  type AdaptiveCardAccordionPage,
} from '../adaptive-card-types'

import { ElementList } from '../element-node'
import { FONT_SIZE_CLASS } from '../lib/size-tokens'
import { getContainerStyleClass } from '../lib/color-tokens'
import { renderLucideIcon } from './icon-element'

function pageKey(page: AdaptiveCardAccordionPage, idx: number): string {
  return page.id ?? `page-${idx}`
}

function Header({ page }: { page: AdaptiveCardAccordionPage }) {
  const titleSizeClass = FONT_SIZE_CLASS[page.headerSize ?? 'default']
  const trailingIcon = page.expandIconPosition !== 'leading'

  const labelNode = (
    <span className={cn('flex items-center gap-2 min-w-0', titleSizeClass)}>
      {page.headerIconName
        ? renderLucideIcon(page.headerIconName, 'size-4 shrink-0')
        : null}
      <span
        className={cn(
          'font-medium',
          page.headerWrap === false
            ? 'truncate'
            : 'whitespace-normal break-words',
        )}
      >
        {page.headerTitle ?? 'Section'}
      </span>
    </span>
  )

  return (
    <AccordionTrigger
      className={cn(
        'py-3',
        !trailingIcon
          ? 'flex-row-reverse justify-end gap-2 [&>svg]:rotate-0'
          : '',
      )}
    >
      {labelNode}
    </AccordionTrigger>
  )
}

export function AccordionElement({
  element,
}: {
  element: AdaptiveCardAccordion
}) {
  const items = useMemo(() => element.items ?? [], [element.items])
  const allowMultiple = element.allowMultipleExpandedPages === true
  const allowCollapseAll = element.allowCollapseAllPages !== false

  const initialOpen = useMemo(() => {
    const expanded = items
      .map((page, idx) => ({ page, idx }))
      .filter(({ page }) => page.isExpanded === true)

    if (expanded.length === 0) {
      if (allowCollapseAll) return allowMultiple ? [] : ''

      const firstPage = items[0]

      if (!firstPage) return allowMultiple ? [] : ''

      return allowMultiple ? [pageKey(firstPage, 0)] : pageKey(firstPage, 0)
    }

    if (allowMultiple) {
      return expanded.map(({ page, idx }) => pageKey(page, idx))
    }

    const first = expanded[0]

    if (!first) return ''

    return pageKey(first.page, first.idx)
  }, [items, allowMultiple, allowCollapseAll])

  if (items.length === 0) return null

  if (allowMultiple) {
    return (
      <Accordion
        type="multiple"
        defaultValue={initialOpen as Array<string>}
        className="w-full"
      >
        {items.map((page, idx) => {
          const key = pageKey(page, idx)
          const styleClass = getContainerStyleClass(page.style)

          return (
            <AccordionItem
              key={key}
              value={key}
              className={cn(
                styleClass,
                page.style && page.style !== 'default'
                  ? 'px-3 rounded-md mb-1'
                  : '',
              )}
            >
              <Header page={page} />
              <AccordionContent>
                <ElementList items={page.items} />
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    )
  }

  return (
    <Accordion
      type="single"
      collapsible={allowCollapseAll}
      defaultValue={initialOpen as string}
      className="w-full"
    >
      {items.map((page, idx) => {
        const key = pageKey(page, idx)
        const styleClass = getContainerStyleClass(page.style)

        return (
          <AccordionItem
            key={key}
            value={key}
            className={cn(
              styleClass,
              page.style && page.style !== 'default'
                ? 'px-3 rounded-md mb-1'
                : '',
            )}
          >
            <Header page={page} />
            <AccordionContent>
              <ElementList items={page.items} />
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
