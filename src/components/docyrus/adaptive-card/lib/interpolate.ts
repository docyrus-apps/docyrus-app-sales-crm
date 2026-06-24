// @ts-nocheck
/* eslint-disable */
import { type AdaptiveCardInputValue } from '../adaptive-card-types'

/*
 * Adaptive Cards 1.5 supports `${input.<id>}` template substitution inside an
 * action's `data` payload — the host replaces the placeholder with the current
 * value of the named input before dispatching the submit / execute event.
 *
 * The substitution syntax is intentionally narrow: only `${input.<id>}` is
 * recognized. Any other ${} sequence is left untouched so the host's payload
 * doesn't get garbled when it contains incidental dollar-sign template strings
 * (for example user-typed prices or shell-style references).
 */

const INPUT_REF_RE = /\$\{input\.([A-Za-z0-9_-]+)\}/g

function valueToString(value: AdaptiveCardInputValue | undefined): string {
  if (value == null) return ''
  if (Array.isArray(value)) return value.join(',')
  if (typeof value === 'boolean') return value ? 'true' : 'false'

  return String(value)
}

function interpolateString(
  input: string,
  values: Record<string, AdaptiveCardInputValue>,
): string {
  return input.replace(INPUT_REF_RE, (match, id: string) => {
    if (id in values) return valueToString(values[id])

    return match
  })
}

export function interpolateData<T>(
  data: T,
  values: Record<string, AdaptiveCardInputValue>,
): T {
  if (typeof data === 'string') {
    return interpolateString(data, values) as unknown as T
  }

  if (Array.isArray(data)) {
    return data.map((item) => interpolateData(item, values)) as unknown as T
  }

  if (data && typeof data === 'object') {
    const result: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(data)) {
      result[key] = interpolateData(value, values)
    }

    return result as unknown as T
  }

  return data
}
