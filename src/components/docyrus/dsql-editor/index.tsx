'use client'

// @ts-nocheck
/* eslint-disable */
export {
  type DsqlEditorProps,
  type DsqlEditorClient,
  type DsqlRunResult,
  type DsqlRunState,
  type DsqlColumnMeta,
  type DsqlTableSchema,
  type DsqlEditorHandle,
  type DsqlAiAssistantRenderProps,
  type DsqlCodeEditorProps,
  type SQLNamespace,
} from './dsql-editor-types'
export { DsqlEditor } from './dsql-editor'
export { DsqlCodeEditor } from './dsql-code-editor'
export {
  useApplyDsql,
  type IUseApplyDsqlResult,
  type UseApplyDsqlOptions,
} from './use-apply-dsql'
export { useDsqlSchema, type UseDsqlSchemaResult } from './use-dsql-schema'
export {
  runDsqlQuery,
  normalizeDsqlResponse,
  extractDsqlError,
} from './lib/run-query'
export {
  parseDsqlColumns,
  dsqlSchemasToNamespace,
  fetchDsqlAppSchema,
  fetchDsqlSchemaNamespace,
} from './lib/dsql-schema'
export { formatSql } from './lib/format-sql'
export { sqlExtensions, type SqlExtensionsOptions } from './lib/sql-language'
export { parseCteColumns } from './lib/parse-cte'
