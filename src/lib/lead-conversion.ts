export type RelationLike =
  | string
  | {
      id?: string
      name?: string
      label?: string
      firstname?: string
      lastname?: string
      [key: string]: unknown
    }
  | null
  | undefined

export type LeadConversionRecord = {
  converted_deal?: RelationLike
  conversion_state?: RelationLike
}

export function getRelationId(value: unknown): string | undefined {
  if (!value) return undefined
  if (typeof value === 'string') return value
  if (typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'string' ? id : undefined
  }

  return undefined
}

export function getRelationName(value: unknown): string | undefined {
  if (!value) return undefined
  if (typeof value === 'string') return value
  if (typeof value !== 'object') return undefined

  const record = value as {
    name?: unknown
    label?: unknown
    firstname?: unknown
    lastname?: unknown
  }

  if (typeof record.name === 'string') return record.name
  if (typeof record.label === 'string') return record.label

  const fullName = [record.firstname, record.lastname]
    .filter(
      (part): part is string => typeof part === 'string' && part.length > 0,
    )
    .join(' ')

  return fullName || undefined
}

export function normalizeConversionKey(value?: string | null): string {
  return (
    value
      ?.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '') ?? ''
  )
}

export function isConversionState(value: unknown, state: string): boolean {
  return (
    normalizeConversionKey(getRelationName(value)) ===
    normalizeConversionKey(state)
  )
}

export function isLeadConvertedRecord(
  lead?: LeadConversionRecord | null,
): boolean {
  return Boolean(
    lead?.converted_deal ||
    isConversionState(lead?.conversion_state, 'completed'),
  )
}
