// @ts-nocheck
/* eslint-disable */
import {
  type DsqlColumnMeta,
  type DsqlEditorClient,
  type DsqlRunResult,
} from '../dsql-editor-types'

/** Number of leading rows sampled to infer column order + types. */
const SAMPLE_SIZE = 50

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

/**
 * Runs a DSQL query against `PUT /v1/dsql/query`. On bad SQL, over-length, or
 * insufficient scope the backend responds non-2xx and `put` rejects — callers
 * should catch and surface {@link extractDsqlError}.
 */
export async function runDsqlQuery(
  client: Pick<DsqlEditorClient, 'put'>,
  query: string,
): Promise<DsqlRunResult> {
  const raw = await client.put('/v1/dsql/query', { query })

  return normalizeDsqlResponse(raw)
}

/** Infers a coarse column type from the first non-nullish sampled value. */
function inferColumnType(value: unknown): DsqlColumnMeta['type'] | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'

  if (typeof value === 'string') {
    if (UUID_REGEX.test(value)) return 'uuid'
    if (ISO_DATETIME_REGEX.test(value)) return 'datetime'
    if (ISO_DATE_REGEX.test(value)) return 'date'

    return 'string'
  }

  return 'string'
}

/**
 * Parses the DSQL run response into a {@link DsqlRunResult}. The API wraps the
 * payload as `{ success, data: row[], meta: { count } }`; the REST client returns
 * that body directly, so rows live at `raw.data`. This also tolerates a bare
 * array and a doubly-wrapped `{ data: { data: row[], meta } }` shape so it keeps
 * working regardless of client interceptors. No column metadata is returned, so
 * columns are inferred from the row keys (first row defines SELECT order; later
 * rows contribute missing keys), with coarse types sniffed from sampled values.
 */
export function normalizeDsqlResponse(raw: unknown): DsqlRunResult {
  const rows = unwrapRows(raw)
  const sample = rows.slice(0, SAMPLE_SIZE)
  const order: string[] = []
  const seen = new Set<string>()
  const types = new Map<string, DsqlColumnMeta['type']>()

  for (const row of sample) {
    for (const [key, value] of Object.entries(row ?? {})) {
      if (!seen.has(key)) {
        seen.add(key)
        order.push(key)
      }

      if (!types.get(key)) {
        const inferred = inferColumnType(value)

        if (inferred) types.set(key, inferred)
      }
    }
  }

  const columns: DsqlColumnMeta[] = order.map((name) => ({
    name,
    type: types.get(name),
  }))
  const count =
    (raw as { meta?: { count?: number } })?.meta?.count ??
    (raw as { data?: { meta?: { count?: number } } })?.data?.meta?.count

  return {
    rows,
    columns,
    rowCount: typeof count === 'number' ? count : rows.length,
  }
}

/** Pulls the row array out of the response, tolerating array / wrapped / nested shapes. */
function unwrapRows(raw: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(raw)) return raw as Array<Record<string, unknown>>

  const data = (raw as { data?: unknown })?.data

  if (Array.isArray(data)) return data as Array<Record<string, unknown>>

  const nested = (data as { data?: unknown })?.data

  if (Array.isArray(nested)) return nested as Array<Record<string, unknown>>

  return []
}

/**
 * Pulls a human-readable message out of a rejected request. The DSQL API errors
 * with `{ success: false, error, error_description }`; the REST client surfaces
 * that body on the thrown error's `.details`, so `error_description` (the real
 * SQL / scope message) is preferred. Network / timeout failures get a friendlier
 * hint because a long-running query can be reset by the gateway before the app's
 * CORS-headed error response is returned.
 */
export function extractDsqlError(err: unknown): string {
  const e = err as {
    name?: string
    code?: string
    message?: string
    details?: {
      error_description?: unknown
      message?: unknown
      error?: unknown
    }
    response?: {
      data?: { error_description?: unknown; message?: unknown; error?: unknown }
    }
  }

  if (
    e?.code === 'NETWORK_ERROR' ||
    e?.name === 'NetworkError' ||
    e?.message === 'Network request failed'
  ) {
    return 'Network error — the request did not complete. A long-running query may have hit the 15s server limit; add LIMIT or filters and try again.'
  }

  if (e?.code === 'TIMEOUT_ERROR' || e?.name === 'TimeoutError') {
    return 'The query timed out. Add LIMIT or filters to narrow it.'
  }

  const body = e?.details ?? e?.response?.data
  const errorField = typeof body?.error === 'string' ? body.error : undefined
  const msg =
    body?.error_description ?? body?.message ?? errorField ?? e?.message

  if (Array.isArray(msg)) return msg.join(', ')

  return typeof msg === 'string' && msg.trim() ? msg : 'Query failed'
}
