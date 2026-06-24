'use client'

// @ts-nocheck
/* eslint-disable */
import { BadgeCheck, ShieldCheck, ShieldX } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import {
  CONSENT_STATUS_TONE,
  humanizeEnum,
  STATUS_TONE_CLASSES,
  VALIDATION_STATUS_TONE,
} from './lib/contact-channels'
import { type ConsentStatus, type ValidationStatus } from './types'

/** Outcome chip for a channel's latest validation result. */
export function ValidationStatusBadge({
  status,
  on,
  className,
}: {
  status: ValidationStatus
  on?: string | null
  className?: string
}) {
  const tone = VALIDATION_STATUS_TONE[status] ?? 'muted'

  const badge = (
    <Badge
      variant="outline"
      className={cn('gap-1 font-medium', STATUS_TONE_CLASSES[tone], className)}
    >
      {humanizeEnum(status)}
    </Badge>
  )

  if (!on) return badge

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent>Validated {new Date(on).toLocaleString()}</TooltipContent>
    </Tooltip>
  )
}

/** Chip for one consent status (opted in / out / unknown). */
export function ConsentStatusBadge({
  status,
  label,
  className,
}: {
  status: ConsentStatus
  label?: string
  className?: string
}) {
  const tone = CONSENT_STATUS_TONE[status] ?? 'muted'

  return (
    <Badge
      variant="outline"
      className={cn('gap-1 font-medium', STATUS_TONE_CLASSES[tone], className)}
    >
      {label ?? humanizeEnum(status)}
    </Badge>
  )
}

/** Ownership-confirmation indicator (distinct from deliverability validation). */
export function VerifiedBadge({
  verified,
  on,
  className,
}: {
  verified: boolean | undefined
  on?: string | null
  className?: string
}) {
  if (!verified) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400',
            className,
          )}
        >
          <BadgeCheck className="size-3.5" />
          Verified
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {on
          ? `Ownership confirmed ${new Date(on).toLocaleString()}`
          : 'Ownership confirmed'}
      </TooltipContent>
    </Tooltip>
  )
}

/** Small inline opt-in / opt-out icon. */
export function ConsentStatusIcon({
  status,
  className,
}: {
  status: ConsentStatus
  className?: string
}) {
  if (status === 'opted_in') {
    return (
      <ShieldCheck
        className={cn(
          'size-3.5 text-emerald-600 dark:text-emerald-400',
          className,
        )}
      />
    )
  }

  if (status === 'opted_out') {
    return <ShieldX className={cn('size-3.5 text-destructive', className)} />
  }

  return (
    <ShieldCheck className={cn('size-3.5 text-muted-foreground', className)} />
  )
}
