'use client'

// @ts-nocheck
/* eslint-disable */
import { type ButtonHTMLAttributes, type Ref } from 'react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/*
 * Cody brand avatar. The current asset is a signed Docyrus storage URL — it
 * carries an `exp=2026-11-22` token, so it works for the rest of this calendar
 * year. Replace with a permanent CDN/static URL (or inline data URI) once the
 * Cody brand asset has a stable home.
 */
const CODY_AVATAR_URL =
  'https://api.docyrus.app/storage/v1/object/sign/tenant/tenant-1006/d-fd156f60-16ac-11ef-aae9-1799ef15b17a/r-01993007-9847-70fa-b405-73ae98916bcf/1764254557133-cody.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wOWU5NWZjMC1lMjI5LTQ0YTgtOWFlOS0zM2U5MWE0ODIwMDkiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ0ZW5hbnQvdGVuYW50LTEwMDYvZC1mZDE1NmY2MC0xNmFjLTExZWYtYWFlOS0xNzk5ZWYxNWIxN2Evci0wMTk5MzAwNy05ODQ3LTcwZmEtYjQwNS03M2FlOTg5MTZiY2YvMTc2NDI1NDU1NzEzMy1jb2R5LnBuZyIsImlhdCI6MTc2NDI1NDU1NywiZXhwIjoxNzk1MzU4NTU3fQ.U988izCqiHZgwxUof_X3GlCvl_qSTxpjDVvmJTzhSsg'

export interface CodyAgentToggleProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  /** Whether the agent drawer is currently open. Drives `aria-pressed` + active ring. */
  active?: boolean
  /** Text shown next to the avatar. Default `'Cody'`. */
  label?: string
  /** Hide the label, render avatar only (icon-only variant). */
  iconOnly?: boolean
  /** Forwarded to the underlying button element. */
  ref?: Ref<HTMLButtonElement>
}

/**
 * Brand-consistent toggle button for opening the EditorAgent drawer. Renders
 * the Cody avatar + `Cody` label on a white background, replacing the generic
 * Bot icon button each editor was using. Pass `iconOnly` for tight toolbar
 * slots (compact mode, table action bars) where the label can't fit.
 */
export function CodyAgentToggle({
  active,
  label = 'Cody',
  iconOnly = false,
  className,
  ref,
  ...props
}: CodyAgentToggleProps) {
  return (
    <Button
      ref={ref}
      type="button"
      variant="outline"
      size="sm"
      aria-pressed={active}
      aria-expanded={active}
      className={cn(
        'gap-1.5 border-border bg-white text-foreground shadow-sm hover:bg-white/90 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200',
        iconOnly ? 'size-7 p-0' : 'h-7 px-2 text-xs font-medium',
        active && 'ring-2 ring-primary/30',
        className,
      )}
      {...props}
    >
      <img
        src={CODY_AVATAR_URL}
        alt={iconOnly ? label : ''}
        aria-hidden={iconOnly ? undefined : true}
        className="size-4 rounded-full object-cover"
      />
      {!iconOnly && <span>{label}</span>}
    </Button>
  )
}
