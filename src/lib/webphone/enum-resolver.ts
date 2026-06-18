import type { EnumEntity } from '@/collections/enums.collection'

/**
 * Slug/name based enum resolution — never hardcode enum IDs (kit Risk 3).
 *
 * The enum catalog from `useEnums()` carries option `name`/`id` but no option
 * slug, so we normalize the kit's slug tokens (`inbound`, `webrtc`,
 * `reached_success`) and match them against the normalized option name
 * (`Inbound` → `inbound`, `WebRTC` → `webrtc`, `Reached - Success` →
 * `reached_success`). When a token cannot be resolved we return `undefined`
 * and the caller omits the field rather than guessing.
 */
export type EnumCatalog = Record<
  string,
  Record<string, Record<string, Array<EnumEntity>>>
>

export function normalizeEnumToken(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
}

export type ResolveWebphoneEnum = (
  dataSourceSlug: string,
  fieldSlug: string,
  token: unknown,
) => string | undefined

export function createWebphoneEnumResolver(
  catalog: EnumCatalog | undefined,
  appSlug = 'base_callcenter',
): ResolveWebphoneEnum {
  return function resolveEnum(dataSourceSlug, fieldSlug, token) {
    const expected = normalizeEnumToken(token)
    if (!expected) return undefined

    const options = catalog?.[appSlug]?.[dataSourceSlug]?.[fieldSlug] ?? []

    const found = options.find((option) => {
      return (
        normalizeEnumToken(option.name) === expected ||
        normalizeEnumToken(option.id) === expected
      )
    })

    return found?.id
  }
}
