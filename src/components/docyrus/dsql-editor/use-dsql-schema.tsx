'use client'

// @ts-nocheck
/* eslint-disable */
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  type DsqlEditorClient,
  type DsqlTableSchema,
  type SQLNamespace,
} from './dsql-editor-types'
import { dsqlSchemasToNamespace, fetchDsqlAppSchema } from './lib/dsql-schema'

export interface UseDsqlSchemaResult {
  /** Autocomplete namespace — pass to `<DsqlEditor schema={...}>`. */
  schema: SQLNamespace
  /** Raw fetched tables (feed `schema` text into the agent's `editorContext`). */
  tables: DsqlTableSchema[]
  isLoading: boolean
  error: string | null
}

const EMPTY_NAMESPACE: SQLNamespace = {}

/**
 * Fetches the DSQL schema for the given apps (`GET /v1/dsql/schema/apps/:appSlug`)
 * and builds a CodeMirror autocomplete namespace plus the flat table list. Re-runs
 * when `client` or the app list changes; apps that fail to load are skipped.
 *
 * ```tsx
 * const { schema, tables } = useDsqlSchema(client, ['base']);
 * <DsqlEditor client={client} schema={schema} />
 * ```
 */
export function useDsqlSchema(
  client: Pick<DsqlEditorClient, 'get'> | null | undefined,
  appSlugs: ReadonlyArray<string>,
): UseDsqlSchemaResult {
  const [tables, setTables] = useState<DsqlTableSchema[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /*
   * Read the client from a ref so an unstable `useDocyrusAuth().client` identity
   * (a fresh object every render) doesn't re-fire the effect and cancel the
   * in-flight fetch on every render — which would leave `tables` stuck empty.
   */
  const clientRef = useRef(client)

  clientRef.current = client

  const appsKey = appSlugs.join(',')
  const hasClient = Boolean(client?.get)

  useEffect(() => {
    const apps = appsKey ? appsKey.split(',') : []
    const activeClient = clientRef.current

    if (!activeClient?.get || apps.length === 0) {
      setTables([])
      setError(null)

      return
    }

    let cancelled = false

    setIsLoading(true)
    setError(null)

    void Promise.all(
      apps.map((app) =>
        fetchDsqlAppSchema(activeClient, app).catch(
          () => [] as DsqlTableSchema[],
        ),
      ),
    )
      .then((results) => {
        if (cancelled) return
        setTables(results.flat())
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(
          err instanceof Error ? err.message : 'Failed to load DSQL schema',
        )
        setTables([])
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [appsKey, hasClient])

  const schema = useMemo<SQLNamespace>(
    () =>
      tables.length > 0 ? dsqlSchemasToNamespace(tables) : EMPTY_NAMESPACE,
    [tables],
  )

  return {
    schema,
    tables,
    isLoading,
    error,
  }
}
