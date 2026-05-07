'use client'

import { useCallback, useState } from 'react'

import { type RestApiClient } from '@docyrus/api-client'
import { type RuleGroupType } from 'react-querybuilder'

/**
 * Body shape POSTed to the server-side export endpoint
 * (`POST /v1/edge/run/query-export`). Mirrors the payload the legacy Vue
 * frontend assembled in `exportToXlsxRemote`.
 */
export interface DocyrusDataExportPayload {
  /** Target data source ID — required by the edge query. */
  dataSourceId: string
  /**
   * Columns to include in the export. Pass `'*'` (or omit) to let the server
   * default to every exportable field, or an array of field slugs to project a
   * specific subset. Slugs may carry inline projections such as
   * `country(id,name,autonumber_id)`. The hook serializes the array into a
   * comma-separated string before POSTing to the endpoint.
   */
  columns?: '*' | ReadonlyArray<string>
  /**
   * Filter group applied to the underlying items query. Pass the same shape
   * used by the items endpoint (combinator + rules).
   */
  filters?: RuleGroupType | null
  /** Free-text keyword search forwarded to the server. */
  filterKeyword?: string
  /** Maximum number of rows to export. Defaults to the hook's `defaultLimit`. */
  limit?: number
  /** Optional override for the export format (server-controlled, defaults to xlsx). */
  format?: 'xlsx' | 'csv'
  /** Free-form extras forwarded verbatim to the endpoint. */
  [key: string]: unknown
}

export interface UseDocyrusDataExportOptions {
  /** Authenticated REST client used to POST the export request. */
  client: RestApiClient
  /** Default row cap when `payload.limit` is omitted. Defaults to `10000`. */
  defaultLimit?: number
  /**
   * Endpoint path. Defaults to `/v1/edge/run/query-export`. Override only when
   * a deployment exposes the export edge function under a different route.
   */
  endpoint?: string
}

export interface UseDocyrusDataExportResult {
  /**
   * Trigger a server-side export. The server responds with a binary file
   * (xlsx by default) and the underlying `client.download` writes it straight
   * to the user's browser using the Content-Disposition filename.
   */
  exportData: (payload: DocyrusDataExportPayload) => Promise<void>
  /** True while a request is in flight. */
  isExporting: boolean
  /** Last error thrown by `exportData` (cleared on every new attempt). */
  error: Error | null
}

/**
 * Hook that wraps the Docyrus server-side export endpoint
 * (`POST /v1/edge/run/query-export`).
 *
 * Unlike `useDataExport` (which projects already-loaded rows into a local
 * file), this hook hands a query payload to the server and lets it stream back
 * the full result set as an xlsx attachment — well-suited to exports that
 * exceed the browser's working set.
 */
export function useDocyrusDataExport(
  options: UseDocyrusDataExportOptions,
): UseDocyrusDataExportResult {
  const {
    client,
    defaultLimit = 10000,
    endpoint = '/v1/edge/run/query-export',
  } = options

  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const exportData = useCallback(
    async (payload: DocyrusDataExportPayload) => {
      setIsExporting(true)
      setError(null)

      try {
        const body = buildExportBody(payload, defaultLimit)

        await client.download(endpoint, body)
      } catch (caught) {
        const normalized =
          caught instanceof Error ? caught : new Error(String(caught))

        setError(normalized)
        throw normalized
      } finally {
        setIsExporting(false)
      }
    },
    [client, defaultLimit, endpoint],
  )

  return { exportData, isExporting, error }
}

function buildExportBody(
  payload: DocyrusDataExportPayload,
  defaultLimit: number,
): Record<string, unknown> {
  const { dataSourceId, columns, filters, filterKeyword, limit, ...rest } =
    payload

  const body: Record<string, unknown> = {
    ...rest,
    dataSourceId,
    columns: normalizeColumns(columns),
    filters: filters && filters.rules.length > 0 ? filters : null,
    limit: typeof limit === 'number' && limit > 0 ? limit : defaultLimit,
  }

  if (filterKeyword && filterKeyword.length > 0) {
    body.filterKeyword = filterKeyword
  }

  return body
}

function normalizeColumns(
  columns: DocyrusDataExportPayload['columns'],
): string {
  if (!columns || columns === '*') return '*'

  const list = Array.from(columns).filter(
    (slug): slug is string => typeof slug === 'string' && slug.length > 0,
  )

  return list.length > 0 ? list.join(',') : '*'
}
