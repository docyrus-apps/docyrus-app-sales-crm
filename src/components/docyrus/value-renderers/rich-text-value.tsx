'use client'

import { cn } from '@/lib/utils'

import { type DocyrusValueProps } from './types'

import { getCompanionValue } from './utils'

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

export function RichTextValue({
  field,
  value,
  record,
  className,
}: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>
  }

  const htmlContent = getCompanionValue(record, field.slug, 'html')
  const source = typeof htmlContent === 'string' ? htmlContent : String(value)
  const text = stripHtmlTags(source)

  if (!text) {
    return <span className="text-muted-foreground">—</span>
  }

  return <span className={cn('line-clamp-2 text-sm', className)}>{text}</span>
}
