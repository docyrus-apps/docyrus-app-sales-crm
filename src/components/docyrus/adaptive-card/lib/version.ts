// @ts-nocheck
/* eslint-disable */
/*
 * Lightweight semver-style comparator for the Adaptive Cards `version`
 * and per-element `requires` checks. Card versions are dotted decimals such
 * as "1.0", "1.3", "1.5" — there are no pre-release suffixes in the spec.
 */

function parse(version: string): Array<number> {
  return version.split('.').map((part) => {
    const n = Number.parseInt(part, 10)

    return Number.isFinite(n) ? n : 0
  })
}

function compare(a: string, b: string): number {
  const av = parse(a)
  const bv = parse(b)
  const len = Math.max(av.length, bv.length)

  for (let i = 0; i < len; i++) {
    const ai = av[i] ?? 0
    const bi = bv[i] ?? 0

    if (ai > bi) return 1
    if (ai < bi) return -1
  }

  return 0
}

export function gte(a: string, b: string): boolean {
  return compare(a, b) >= 0
}

export function gt(a: string, b: string): boolean {
  return compare(a, b) > 0
}

export function isValidVersion(value: unknown): value is string {
  if (typeof value !== 'string') return false

  return /^\d+(\.\d+)*$/.test(value)
}

export const RENDERER_CAPABILITIES: Readonly<Record<string, string>> =
  Object.freeze({
    adaptiveCards: '1.6',
  })

export function satisfiesRequires(
  requires: Record<string, string> | undefined,
  capabilities: Record<string, string> = RENDERER_CAPABILITIES,
): boolean {
  if (!requires) return true

  for (const [name, requiredVersion] of Object.entries(requires)) {
    const capability = capabilities[name]

    if (!capability) return false
    if (!gte(capability, requiredVersion)) return false
  }

  return true
}
