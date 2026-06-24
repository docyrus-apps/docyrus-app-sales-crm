'use client'

// @ts-nocheck
/* eslint-disable */
import { Phone } from 'lucide-react'

import { cn } from '@/lib/utils'

import { type DocyrusValueProps } from './types'

import { formatPhoneDisplay, getCompanionValue } from './utils'

export function PhoneValue({
  field,
  value,
  record,
  className,
}: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">–</span>
  }

  const phone = String(value)
  const countryCode =
    getCompanionValue(record, field.slug, 'country') ??
    getCompanionValue(record, field.slug, 'country_code')
  const normalizedCountryCode =
    typeof countryCode === 'string' ? countryCode : null
  const display = formatPhoneDisplay(phone, normalizedCountryCode)

  return (
    <a
      href={`tel:${normalizedCountryCode ?? ''}${phone}`}
      className={cn(
        'inline-flex min-w-0 max-w-full items-center gap-1 text-primary underline-offset-4 hover:underline',
        className,
      )}
    >
      <Phone className="size-3.5 shrink-0" />
      <span className="truncate">{display}</span>
    </a>
  )
}
