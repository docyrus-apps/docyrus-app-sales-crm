'use client'

// @ts-nocheck
/* eslint-disable */
import { cn } from '@/lib/utils'

import { type DocyrusAgentThread } from '@/hooks/docyrus/use-docyrus-agent-threads'

export interface DocyrusAgentProjectThreadRowProps {
  thread: DocyrusAgentThread
  isActive?: boolean
  onSelect?: (thread: DocyrusAgentThread) => void
  className?: string
}

/**
 * Card-style thread row used in the project detail Sessions tab — a small status dot,
 * the thread title, and the full `DD.MM.YYYY at HH:MM:SS` timestamp on the second line.
 */
export const DocyrusAgentProjectThreadRow = ({
  thread,
  isActive,
  onSelect,
  className,
}: DocyrusAgentProjectThreadRowProps) => (
  <button
    className={cn(
      'flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/40',
      isActive && 'border-border bg-muted/40',
      className,
    )}
    type="button"
    onClick={() => onSelect?.(thread)}
  >
    <span className="size-2 shrink-0 rounded-full bg-muted-foreground/40" />
    <div className="min-w-0 flex-1">
      <div className="truncate text-sm font-medium">{thread.title}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">
        {formatDateTime(thread.createdAt)}
      </div>
    </div>
  </button>
)

function formatDateTime(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')

  return `${dd}.${mm}.${yyyy} at ${hh}:${mi}:${ss}`
}
