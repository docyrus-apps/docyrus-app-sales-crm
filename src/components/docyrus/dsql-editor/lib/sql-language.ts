// @ts-nocheck
/* eslint-disable */
import { type Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { PostgreSQL, type SQLNamespace, sql } from '@codemirror/lang-sql'

export interface SqlExtensionsOptions {
  /**
   * Autocomplete schema — a nested `appSlug → dataSourceSlug → columns`
   * namespace. When provided, table + column completion is enabled on top of
   * keyword completion.
   */
  schema?: SQLNamespace
}

/**
 * CodeMirror extensions for the DSQL query pane: PostgreSQL syntax highlighting,
 * keyword + (optional) schema-driven autocomplete, and soft line wrapping.
 */
export function sqlExtensions({
  schema,
}: SqlExtensionsOptions = {}): Extension[] {
  return [
    EditorView.lineWrapping,
    sql({ dialect: PostgreSQL, upperCaseKeywords: true, schema }),
  ]
}
