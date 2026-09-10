/*
 * Phone normalization helpers shared by matching, storage and dialing.
 * Matching is digit-based with a last-10 fallback so `0544...`, `+90544...`
 * and spaced formats resolve to the same customer (kit Risk 2).
 */

export function normalizePhoneForMatch(
  value: string | undefined | null
): string {
  if (!value) return ''

  return value.replace(/\D/g, '')
}

export function samePhone(
  left: string | undefined | null,
  right: string | undefined | null
): boolean {
  const l = normalizePhoneForMatch(left)
  const r = normalizePhoneForMatch(right)

  if (!l || !r) return false
  if (l === r) return true

  const ll = l.slice(-10)
  const rr = r.slice(-10)

  return ll.length >= 7 && ll === rr
}

/** E.164-ish storage format: `+` plus digits when we have at least 7 digits. */
export function normalizePhoneForStorage(
  value: string | undefined | null
): string | undefined {
  const digits = normalizePhoneForMatch(value)

  if (digits.length >= 7) return `+${digits}`

  return value?.trim() || undefined
}

/** Strips to a dialable string (digits, keeping a leading `+`). */
export function toDialableTarget(value: string | undefined | null): string {
  if (!value) return ''
  const trimmed = value.trim()
  const hasPlus = trimmed.startsWith('+')
  const digits = normalizePhoneForMatch(trimmed)

  if (!digits) return ''

  return hasPlus ? `+${digits}` : digits
}
