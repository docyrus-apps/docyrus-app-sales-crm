'use client'

// @ts-nocheck
/* eslint-disable */
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'

import { type AdaptiveCardTextBlock } from '../adaptive-card-types'

import {
  FONT_SIZE_CLASS,
  FONT_TYPE_CLASS,
  FONT_WEIGHT_CLASS,
  HORIZONTAL_ALIGN_CLASS,
  getHeadingTag,
  getLineClampClass,
} from '../lib/size-tokens'

import { getTextColorClass } from '../lib/color-tokens'

const inlineComponents: Components = {
  p: ({ children, className }) => <span className={className}>{children}</span>,
  strong: ({ children, className }) => (
    <strong className={cn('font-semibold', className)}>{children}</strong>
  ),
  em: ({ children, className }) => (
    <em className={cn('italic', className)}>{children}</em>
  ),
  del: ({ children, className }) => (
    <del className={cn('line-through', className)}>{children}</del>
  ),
  a: ({ className, href, children, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'text-primary underline-offset-2 hover:underline',
        className,
      )}
      {...props}
    >
      {children}
    </a>
  ),
  code: ({ children, className }) => (
    <code
      className={cn(
        'rounded bg-muted px-1 py-0.5 text-[0.85em] font-mono',
        className,
      )}
    >
      {children}
    </code>
  ),
  ul: ({ children, className }) => (
    <ul className={cn('list-disc pl-5', className)}>{children}</ul>
  ),
  ol: ({ children, className }) => (
    <ol className={cn('list-decimal pl-5', className)}>{children}</ol>
  ),
  li: ({ children, className }) => <li className={className}>{children}</li>,
}

export function TextBlockElement({
  element,
}: {
  element: AdaptiveCardTextBlock
}) {
  const sizeClass = FONT_SIZE_CLASS[element.size ?? 'default']
  const weightClass = FONT_WEIGHT_CLASS[element.weight ?? 'default']
  const fontTypeClass = FONT_TYPE_CLASS[element.fontType ?? 'default']
  const colorClass = getTextColorClass(element.color, element.isSubtle)
  const alignClass =
    HORIZONTAL_ALIGN_CLASS[element.horizontalAlignment ?? 'left']

  const wrap = element.wrap !== false
  const lineClampClass = getLineClampClass(element.maxLines)

  const wrapClass = wrap
    ? 'whitespace-pre-wrap break-words'
    : 'whitespace-nowrap overflow-hidden text-ellipsis'

  const classes = cn(
    sizeClass,
    weightClass,
    fontTypeClass,
    colorClass,
    alignClass,
    wrapClass,
    lineClampClass,
    'leading-relaxed',
  )

  const markdown = (
    <Markdown remarkPlugins={[remarkGfm]} components={inlineComponents}>
      {element.text}
    </Markdown>
  )

  if (element.style === 'heading') {
    const tag = getHeadingTag(element.size)

    switch (tag) {
      case 'h1':
        return <h1 className={classes}>{markdown}</h1>

      case 'h2':
        return <h2 className={classes}>{markdown}</h2>

      case 'h3':
        return <h3 className={classes}>{markdown}</h3>

      case 'h4':
        return <h4 className={classes}>{markdown}</h4>

      case 'h5':
        return <h5 className={classes}>{markdown}</h5>

      case 'h6':
        return <h6 className={classes}>{markdown}</h6>

      default:
        return <h4 className={classes}>{markdown}</h4>
    }
  }

  return <div className={classes}>{markdown}</div>
}
