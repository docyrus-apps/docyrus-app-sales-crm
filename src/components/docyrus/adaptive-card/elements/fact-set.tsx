'use client'

// @ts-nocheck
/* eslint-disable */
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'

import { type AdaptiveCardFactSet } from '../adaptive-card-types'

const inlineComponents: Components = {
  p: ({ children }) => <>{children}</>,
  strong: ({ children, className }) => (
    <strong className={cn('font-semibold', className)}>{children}</strong>
  ),
  em: ({ children, className }) => (
    <em className={cn('italic', className)}>{children}</em>
  ),
  a: ({ children, href, className }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('text-primary hover:underline', className)}
    >
      {children}
    </a>
  ),
}

export function FactSetElement({ element }: { element: AdaptiveCardFactSet }) {
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-sm">
      {element.facts.map((fact) => (
        <div key={`${fact.title}-${fact.value}`} className="contents">
          <dt className="font-semibold text-foreground">{fact.title}</dt>
          <dd className="text-foreground">
            <Markdown remarkPlugins={[remarkGfm]} components={inlineComponents}>
              {fact.value}
            </Markdown>
          </dd>
        </div>
      ))}
    </dl>
  )
}
