'use client'

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
    return <span className="text-muted-foreground">—</span>
  }

  const phone = String(value)
  const countryCode = getCompanionValue(record, field.slug, 'country_code')
  const display = formatPhoneDisplay(
    phone,
    typeof countryCode === 'string' ? countryCode : null,
  )

  return (
    <a
      href={`tel:${typeof countryCode === 'string' ? countryCode : ''}${phone}`}
      className={cn(
        'inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline truncate',
        className,
      )}
    >
      <Phone className="size-3.5 shrink-0" />
      <span className="truncate">{display}</span>
    </a>
  )
}
