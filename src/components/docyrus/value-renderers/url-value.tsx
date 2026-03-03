'use client'

import { Link } from 'lucide-react'

import { cn } from '@/lib/utils'

import { type DocyrusValueProps } from './types'

export function UrlValue({ value, className }: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>
  }

  const url = String(value)
  let hostname = url

  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)

    ;({ hostname } = parsed)
  } catch {}

  const href = url.startsWith('http') ? url : `https://${url}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline truncate',
        className,
      )}
    >
      <Link className="size-3.5 shrink-0" />
      <span className="truncate">{hostname}</span>
    </a>
  )
}
