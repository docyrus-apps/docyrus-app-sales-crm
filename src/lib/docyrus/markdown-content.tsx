'use client'

// @ts-nocheck
/* eslint-disable */
import { type ComponentPropsWithoutRef, type ElementType } from 'react'

import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'

interface MarkdownContentProps {
  content: string
  className?: string
}

function el<T extends ElementType>(Tag: T, base: string) {
  return function MdEl({ className, ...props }: ComponentPropsWithoutRef<T>) {
    // @ts-expect-error -- generic element factory
    return <Tag className={cn(base, className)} {...props} />
  }
}

const components: Components = {
  p: el('p', 'my-0.5 leading-relaxed'),
  strong: el('strong', 'font-semibold'),
  em: el('em', 'italic'),
  h1: el('h1', 'my-2 text-lg font-semibold'),
  h2: el('h2', 'my-1.5 text-base font-semibold'),
  h3: el('h3', 'my-1 text-sm font-semibold'),
  ul: el('ul', 'my-1 list-disc pl-5'),
  ol: el('ol', 'my-1 list-decimal pl-5'),
  li: el('li', 'my-0'),
  blockquote: el(
    'blockquote',
    'my-1.5 border-l-2 border-border pl-3 italic text-muted-foreground',
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = typeof children === 'string' && children.includes('\n')

    if (isBlock) {
      return (
        <code className={cn('block', className)} {...props}>
          {children}
        </code>
      )
    }

    return (
      <code
        className={cn('rounded bg-muted px-1 py-0.5 text-[0.85em]', className)}
        {...props}
      >
        {children}
      </code>
    )
  },
  pre: el('pre', 'my-1.5 overflow-x-auto rounded-md bg-muted p-3 text-sm'),
  a: ({ children, href, className, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('text-primary underline underline-offset-2', className)}
      {...props}
    >
      {children}
    </a>
  ),
  table: el('table', 'my-1.5 w-full border-collapse text-sm'),
  thead: el('thead', 'border-b'),
  th: el('th', 'px-2 py-1 text-left font-medium'),
  td: el('td', 'border-t px-2 py-1'),
  hr: el('hr', 'my-2 border-border'),
  img: ({ className, ...props }) => (
    <img
      className={cn('my-1.5 max-w-full rounded', className)}
      alt=""
      {...props}
    />
  ),
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  if (!content) return null

  return (
    <div className={cn('max-w-none break-words text-foreground', className)}>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </Markdown>
    </div>
  )
}
