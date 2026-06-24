// @ts-nocheck
/* eslint-disable */
import { format } from 'sql-formatter'

/**
 * Pretty-prints a DSQL query. The backend is PostgreSQL-compatible so we use
 * the `postgresql` dialect. Never throws — returns the original text when the
 * formatter can't parse the input (e.g. a half-typed query).
 */
export function formatSql(query: string): string {
  if (!query.trim()) return query

  try {
    return format(query, { language: 'postgresql', keywordCase: 'upper' })
  } catch {
    return query
  }
}
