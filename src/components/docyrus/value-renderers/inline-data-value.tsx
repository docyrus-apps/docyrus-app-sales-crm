'use client'

// @ts-nocheck
/* eslint-disable */
import { Table } from 'lucide-react'

import { cn } from '@/lib/utils'

import { type DocyrusValueProps, type IFieldType } from './types'

const UNIT_BY_TYPE: Partial<
  Record<IFieldType, [singular: string, plural: string]>
> = {
  'field-inlineData': ['row', 'rows'],
  'field-systemVector': ['dim', 'dims'],
  'field-systemBuffer': ['byte', 'bytes'],
}

function getUnit(fieldType: IFieldType): [string, string] {
  return UNIT_BY_TYPE[fieldType] ?? ['item', 'items']
}

function getCount(value: unknown): number {
  if (Array.isArray(value)) return value.length
  if (typeof value === 'number') return value
  if (typeof value === 'string') return value.length
  if (value && typeof value === 'object' && 'byteLength' in value) {
    const { byteLength } = value as { byteLength: unknown }

    if (typeof byteLength === 'number') return byteLength
  }

  return 0
}

export function InlineDataValue({
  field,
  value,
  className,
}: DocyrusValueProps) {
  if (value == null || (Array.isArray(value) && value.length === 0)) {
    return <span className="text-muted-foreground">–</span>
  }

  const count = getCount(value)
  const [singular, plural] = getUnit(field.type)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sm text-muted-foreground',
        className,
      )}
    >
      <Table className="size-3.5 shrink-0" />
      <span>
        {count} {count === 1 ? singular : plural}
      </span>
    </span>
  )
}
