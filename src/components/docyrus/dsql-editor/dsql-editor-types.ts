// @ts-nocheck
/* eslint-disable */
import { type ReactNode, type Ref } from 'react'

import {
  type BasicSetupOptions,
  type ReactCodeMirrorRef,
} from '@uiw/react-codemirror'
import { type Extension } from '@codemirror/state'
import { type SQLNamespace } from '@codemirror/lang-sql'

import { type ColumnDef } from '@/components/docyrus/data-grid'

/**
 * Minimal client contract used by the DSQL editor. `put` runs queries; the
 * optional `get` is only needed for schema-driven autocomplete. Satisfied by
 * `@docyrus/signin`'s `RestApiClient`.
 */
export interface DsqlEditorClient {
  put: <T = unknown>(url: string, body?: unknown) => Promise<T>
  get?: <T = unknown>(url: string) => Promise<T>
}

/**
 * Token-efficient DSQL schema for a single logical data source, returned by the
 * `/v1/dsql/schema/...` endpoints. Mirrors the backend `IDsqlTableSchema`.
 * `schema` is compact `create table appSlug.dataSourceSlug ( … )` DDL text.
 */
export interface DsqlTableSchema {
  id: string
  appSlug: string
  slug: string
  name: string
  title: string
  schema: string
}

export type { SQLNamespace }

/** Resolved metadata for one result column (inferred from the returned rows). */
export interface DsqlColumnMeta {
  /** Column key, taken from the row object keys. */
  name: string
  /** Coarse value type inferred from sampled rows; drives the cell variant. */
  type?: 'number' | 'boolean' | 'date' | 'datetime' | 'uuid' | 'string'
  /** Optional human label (defaults to `name`). */
  label?: string
}

/** Normalized result of a successful DSQL run. */
export interface DsqlRunResult {
  rows: Array<Record<string, unknown>>
  /** Resolved columns (inferred from row keys, preserving SELECT order). */
  columns: DsqlColumnMeta[]
  /** Number of rows returned by the server (`meta.count`). */
  rowCount: number
  /** Client-measured round-trip duration in milliseconds. */
  durationMs?: number
}

/** Discriminated state of the result pane. */
export type DsqlRunState =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'success'; result: DsqlRunResult }
  | { status: 'error'; message: string; code?: string }

/** Imperative handle exposed via `<DsqlEditor ref={...}>`. */
export interface DsqlEditorHandle {
  /**
   * Run a query. With no argument runs the current editor text; pass an
   * explicit query to run it immediately without waiting for controlled state
   * to flush (used to run right after the agent writes a query).
   */
  run: (query?: string) => void
  /** Current editor query text. */
  getQuery: () => string
}

/**
 * Context handed to {@link DsqlEditorProps.renderAiAssistant}. Mirrors the
 * shape `JsonataEditor` passes so the playground's `EditorAgentDrawer` slot
 * works identically across editors.
 */
export interface DsqlAiAssistantRenderProps {
  /** Whether the drawer is currently open. */
  open: boolean
  /** Call to close the drawer from inside the slot. */
  onClose: () => void
  /** Current DSQL query text in the editor. */
  query: string
}

/** Props for the full two-pane {@link DsqlEditor} workbench. */
export interface DsqlEditorProps {
  /** Authenticated client. Omit only when `onRun` is supplied. */
  client?: DsqlEditorClient | null
  /** Override the default `PUT /v1/dsql/query` transport (tests / mocks). */
  onRun?: (query: string) => Promise<DsqlRunResult>

  /** Controlled query text. */
  query?: string
  /** Initial query for uncontrolled usage. */
  defaultQuery?: string
  /** Fired whenever the query text changes. */
  onQueryChange?: (next: string) => void

  /** Fired after a run resolves successfully. */
  onResult?: (result: DsqlRunResult) => void
  /** Fired when a run fails, with the extracted message. */
  onError?: (message: string) => void

  /**
   * SQL autocomplete schema — a nested `appSlug → dataSourceSlug → columns`
   * namespace so `from base.` completes tables and `base.contact.` completes
   * columns. Build it from the schema endpoints with `dsqlSchemasToNamespace`
   * (or the `useDsqlSchema` hook). Omit for keyword-only completion.
   */
  schema?: SQLNamespace

  /** Page size for the result grid. Default `25`. */
  resultPageSize?: number

  /** Overall editor height (CSS value). Default `'100%'`. */
  height?: number | string
  /** Root element className. */
  className?: string

  /**
   * Compact mode — renders only the SQL editor with an expand button that opens
   * the full query / result workbench in a centered dialog. Intended for use
   * inside form fields.
   */
  compactMode?: boolean
  /** Minimum editor height in compact mode. Default `'2.5rem'`. */
  compactMinHeight?: string
  /** Maximum editor height in compact mode. Default `'12rem'`. */
  compactMaxHeight?: string

  /** ── Agent panel slot (identical contract to JsonataEditor) ── */
  /** Controlled open state for the AI Assistant drawer. */
  aiAssistantOpen?: boolean
  /** Fired when the AI Assistant button toggles. */
  onAiAssistantOpenChange?: (open: boolean) => void
  /** Replaces the drawer body — mount a custom agent (e.g. `EditorAgentDrawer`). */
  renderAiAssistant?: (ctx: DsqlAiAssistantRenderProps) => ReactNode

  /** Imperative handle — call `ref.current.run()` to trigger a query run. */
  ref?: Ref<DsqlEditorHandle>
}

/** Props for the standalone {@link DsqlCodeEditor}. */
export interface DsqlCodeEditorProps {
  /** Current SQL text. */
  value: string
  /** Fired on every edit. */
  onChange?: (value: string) => void
  /** Disables editing. */
  readOnly?: boolean
  /** Placeholder shown when empty. */
  placeholder?: string
  /** Focus the editor on mount. */
  autoFocus?: boolean
  /** Minimum editor height (CSS value). Default `'2.5rem'`. */
  minHeight?: string
  /** Maximum editor height (CSS value). Default `'12rem'`. */
  maxHeight?: string
  /** Fixed editor height (CSS value) — overrides min/max when set. */
  height?: string
  /** Wrapper className. */
  className?: string
  /** Show line numbers. Default `true` (SQL). */
  lineNumbers?: boolean
  /** SQL autocomplete schema (`appSlug → dataSourceSlug → columns`). */
  schema?: SQLNamespace
  /** `basicSetup` overrides forwarded to CodeMirror. */
  basicSetup?: BasicSetupOptions
  /** Extra CodeMirror extensions appended after the SQL language. */
  extensions?: Extension[]
  /** Ref to the underlying CodeMirror view, useful for imperative inserts. */
  ref?: Ref<ReactCodeMirrorRef>
}

export type { ColumnDef }
