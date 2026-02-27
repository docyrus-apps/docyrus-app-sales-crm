'use client'

import { MapPin } from 'lucide-react'

import { cn } from '@/lib/utils'

import { type DocyrusValueProps } from './types'

interface LocationData {
  address?: string
  lat?: number
  lng?: number
  latitude?: number
  longitude?: number
}

function isLocationData(val: unknown): val is LocationData {
  return typeof val === 'object' && val !== null
}

export function LocationValue({ value, className }: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>
  }

  let display: string

  if (typeof value === 'string') {
    display = value
  } else if (isLocationData(value)) {
    if (value.address) {
      display = value.address
    } else {
      const lat = value.lat ?? value.latitude
      const lng = value.lng ?? value.longitude

      if (lat != null && lng != null) {
        display = `${lat}, ${lng}`
      } else {
        display = 'Location'
      }
    }
  } else {
    display = String(value)
  }

  return (
    <span className={cn('inline-flex items-center gap-1 text-sm', className)}>
      <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">{display}</span>
    </span>
  )
}
