import type { RowChange } from '@/components/docyrus/data-grid'

const DUPLICATE_EXCLUDED_KEYS = new Set([
  'id',
  'created_on',
  'updated_on',
  'created_at',
  'updated_at'
])

export function buildChangePayload(
  changes: Map<string, { newValue: unknown }>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}

  for (const [columnId, cellChange] of changes) {
    payload[columnId] = cellChange.newValue
  }

  return payload
}

export function buildDuplicatePayload(
  record: Record<string, unknown>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(record)) {
    if (DUPLICATE_EXCLUDED_KEYS.has(key)) continue

    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        payload[key] = value.map((item) => {
          if (item && typeof item === 'object' && 'id' in item) {
            return (item as { id: unknown }).id
          }

          return item
        })
      } else if ('id' in value) {
        payload[key] = value.id
      } else {
        payload[key] = value
      }

      continue
    }

    payload[key] = value
  }

  return payload
}

export async function saveGridChanges<TData extends { id?: string }>(
  changes: Array<RowChange>,
  gridData: Array<TData>,
  updateById: (id: string, data: Record<string, unknown>) => Promise<unknown>
): Promise<void> {
  const updates: Array<Promise<unknown>> = []

  for (const change of changes) {
    // Prefer the authoritative rowId carried on the change itself. The
    // positional `gridData[change.rowIndex]` lookup is fragile: once the grid
    // is sorted/grouped/paginated (or refetched), `rowIndex` no longer lines
    // up with `gridData`, so the lookup returns the wrong row or `undefined`
    // and the update is silently skipped — the edit appears saved but never
    // persists. Fall back to the positional lookup only when rowId is absent.
    const rowId = change.rowId ?? gridData[change.rowIndex]?.id

    if (!rowId) continue

    const payload = buildChangePayload(change.changes)

    updates.push(updateById(rowId, payload))
  }

  await Promise.all(updates)
}
