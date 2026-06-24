// @ts-nocheck
/* eslint-disable */
import { type SQLNamespace } from '@codemirror/lang-sql'

import {
  type DsqlEditorClient,
  type DsqlTableSchema,
} from '../dsql-editor-types'

/** Matches `references appSlug.dataSourceSlug` hints inside the DDL text. */
const REFERENCE_REGEX = /references\s+([a-z0-9_]+)\.([a-z0-9_]+)/gi

/** Well-known system sources the DDL references but the app endpoint doesn't return. */
const SYSTEM_TABLE_COLUMNS: Record<string, Record<string, string[]>> = {
  tenant: {
    user: ['id', 'name', 'email', 'username'],
    enum: ['id', 'name'],
  },
}

/**
 * Extracts column slugs from a single `IDsqlTableSchema.schema` DDL block.
 *
 * The DDL produced by `DsqlSchemaBuilder` looks like:
 * ```
 * -- Title
 * create table base.contact (
 *   id uuid,
 *   email text -- description
 *   company_id uuid references base.organization
 * )
 * ```
 * Column lines start with the slug; comment lines (`--`), `create table`, and
 * the closing `)` are skipped. The trailing ` -- comment` / ` references …` /
 * comma are stripped so only the leading slug is kept.
 */
export function parseDsqlColumns(ddl: string): string[] {
  const columns: string[] = []

  for (const rawLine of ddl.split('\n')) {
    const line = rawLine.trim()

    if (!line || line.startsWith('--')) continue
    if (line.startsWith('create table') || line.startsWith(')')) continue

    const code = (line.split('--')[0] ?? '').replace(/,\s*$/, '').trim()

    if (!code) continue

    const slug = code.split(/\s+/)[0]

    if (slug) columns.push(slug)
  }

  return columns
}

/**
 * Converts the flat `DsqlTableSchema[]` returned by the schema endpoints into a
 * CodeMirror {@link SQLNamespace} nested by `appSlug → dataSourceSlug → columns`
 * — matching DSQL's `app.dataSource` table model so `from base.` completes table
 * names and `base.contact.` completes columns. System sources referenced by the
 * DDL (`tenant.user`, `tenant.enum`) are synthesized with their documented join
 * columns when they aren't part of the returned set.
 */
export function dsqlSchemasToNamespace(
  schemas: ReadonlyArray<DsqlTableSchema>,
): SQLNamespace {
  const namespace: Record<string, Record<string, string[]>> = {}
  const referenced = new Set<string>()

  for (const schema of schemas) {
    if (!schema?.appSlug || !schema?.slug) continue
    ;(namespace[schema.appSlug] ??= {})[schema.slug] = parseDsqlColumns(
      schema.schema ?? '',
    )

    for (const match of (schema.schema ?? '').matchAll(REFERENCE_REGEX)) {
      referenced.add(`${match[1]}.${match[2]}`)
    }
  }

  for (const ref of referenced) {
    const [app, table] = ref.split('.')

    if (!app || !table || namespace[app]?.[table]) continue

    const systemColumns = SYSTEM_TABLE_COLUMNS[app]?.[table]

    if (systemColumns) (namespace[app] ??= {})[table] = systemColumns
  }

  return namespace as SQLNamespace
}

/**
 * Fetches the token-efficient DSQL schema for every queryable data source in an
 * app via `GET /v1/dsql/schema/apps/:appSlug`. Returns the raw `DsqlTableSchema[]`
 * (unwrapped from the `{ data }` envelope). Requires a client with `get`.
 */
export async function fetchDsqlAppSchema(
  client: Pick<DsqlEditorClient, 'get'>,
  appSlug: string,
): Promise<DsqlTableSchema[]> {
  if (typeof client.get !== 'function') {
    throw new Error('fetchDsqlAppSchema requires a client with a `get` method')
  }

  /*
   * API wraps as `{ success, data: IDsqlTableSchema[] }`; the client returns that
   * body directly. Tolerate a bare array and a doubly-wrapped shape too.
   */
  const raw = await client.get(`/v1/dsql/schema/apps/${appSlug}`)

  if (Array.isArray(raw)) return raw as DsqlTableSchema[]

  const data = (raw as { data?: unknown })?.data

  if (Array.isArray(data)) return data as DsqlTableSchema[]

  const nested = (data as { data?: unknown })?.data

  return Array.isArray(nested) ? (nested as DsqlTableSchema[]) : []
}

/**
 * Fetches and merges the DSQL schema for several apps into one
 * {@link SQLNamespace}, plus the flat list of fetched tables (useful for feeding
 * the agent real schema context). Apps that fail to load are skipped.
 */
export async function fetchDsqlSchemaNamespace(
  client: Pick<DsqlEditorClient, 'get'>,
  appSlugs: ReadonlyArray<string>,
): Promise<{ schema: SQLNamespace; tables: DsqlTableSchema[] }> {
  const results = await Promise.all(
    appSlugs.map(async (appSlug) => {
      try {
        return await fetchDsqlAppSchema(client, appSlug)
      } catch {
        return []
      }
    }),
  )

  const tables = results.flat()

  return { schema: dsqlSchemasToNamespace(tables), tables }
}
