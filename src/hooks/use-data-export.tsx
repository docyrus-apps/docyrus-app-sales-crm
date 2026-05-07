'use client'

import { useCallback, useState } from 'react'

export type DataExportFormat = 'csv' | 'json' | 'markdown' | 'xlsx'

export interface DataExportColumn<TData> {
  /** Stable column id (also used as the JSON object key when format = 'json'). */
  id: string
  /** Header label rendered in CSV / Markdown / Excel. */
  header: string
  /**
   * Pull the raw cell value for this column from a row. Defaults to
   * `row[id]` when omitted.
   */
  accessor?: (row: TData) => unknown
  /**
   * Optional formatter run after `accessor` to coerce the raw value into the
   * string written to the file. The default formatter renders primitives
   * verbatim and `JSON.stringify`s objects/arrays.
   */
  formatter?: (value: unknown, row: TData) => string
}

export interface UseDataExportOptions<TData> {
  /** Column projection. Order is preserved in the output. */
  columns: Array<DataExportColumn<TData>>
  /** File name without extension. Default `'export'`. */
  fileName?: string
  /** Sheet name for xlsx. Default `'Sheet1'`. */
  sheetName?: string
  /** Prepend a UTF-8 BOM to CSV output (helps Excel detect encoding). Default `true`. */
  csvBom?: boolean
}

export interface DataExportResult {
  /** MIME type written to the Blob. */
  mimeType: string
  /** File extension including leading dot. */
  extension: string
  /** Final file name (`<fileName><extension>`). */
  fileName: string
}

export interface UseDataExportResult<TData> {
  /**
   * Project `rows` through `columns` and trigger a browser download in the
   * requested `format`. Returns the resolved file name + MIME type.
   * No-ops on the server (returns `null`).
   */
  exportData: (
    rows: Array<TData>,
    format: DataExportFormat,
  ) => Promise<DataExportResult | null>
  isExporting: boolean
}

const FORMAT_META: Record<
  DataExportFormat,
  { extension: string; mimeType: string }
> = {
  csv: { extension: '.csv', mimeType: 'text/csv;charset=utf-8' },
  json: { extension: '.json', mimeType: 'application/json;charset=utf-8' },
  markdown: { extension: '.md', mimeType: 'text/markdown;charset=utf-8' },
  xlsx: {
    extension: '.xlsx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
}

export function useDataExport<TData>(
  options: UseDataExportOptions<TData>,
): UseDataExportResult<TData> {
  const {
    columns,
    fileName = 'export',
    sheetName = 'Sheet1',
    csvBom = true,
  } = options

  const [isExporting, setIsExporting] = useState(false)

  const exportData = useCallback(
    async (rows: Array<TData>, format: DataExportFormat) => {
      if (typeof window === 'undefined') return null

      setIsExporting(true)

      try {
        const meta = FORMAT_META[format]
        const resolvedFileName = `${fileName}${meta.extension}`

        const projected = rows.map((row) => projectRow(row, columns))

        let blob: Blob

        if (format === 'csv') {
          const body = buildCsv(columns, projected, csvBom)

          blob = new Blob([body], { type: meta.mimeType })
        } else if (format === 'json') {
          const body = JSON.stringify(projected, null, 2)

          blob = new Blob([body], { type: meta.mimeType })
        } else if (format === 'markdown') {
          const body = buildMarkdown(columns, projected)

          blob = new Blob([body], { type: meta.mimeType })
        } else {
          blob = await buildXlsxBlob(columns, projected, sheetName)
        }

        triggerDownload(blob, resolvedFileName)

        return {
          mimeType: meta.mimeType,
          extension: meta.extension,
          fileName: resolvedFileName,
        }
      } finally {
        setIsExporting(false)
      }
    },
    [columns, fileName, sheetName, csvBom],
  )

  return { exportData, isExporting }
}

function projectRow<TData>(
  row: TData,
  columns: Array<DataExportColumn<TData>>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const column of columns) {
    const raw = column.accessor
      ? column.accessor(row)
      : (row as Record<string, unknown>)[column.id]

    result[column.id] = column.formatter ? column.formatter(raw, row) : raw
  }

  return result
}

function defaultStringify(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value)
  if (value instanceof Date) return value.toISOString()

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function escapeCsvCell(value: unknown): string {
  const str = defaultStringify(value)

  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

function buildCsv<TData>(
  columns: Array<DataExportColumn<TData>>,
  rows: Array<Record<string, unknown>>,
  withBom: boolean,
): string {
  const header = columns.map((column) => escapeCsvCell(column.header)).join(',')
  const lines = rows.map((row) =>
    columns.map((column) => escapeCsvCell(row[column.id])).join(','),
  )
  const body = [header, ...lines].join('\r\n')

  return withBom ? `﻿${body}` : body
}

function escapeMarkdownCell(value: unknown): string {
  return defaultStringify(value)
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br />')
}

function buildMarkdown<TData>(
  columns: Array<DataExportColumn<TData>>,
  rows: Array<Record<string, unknown>>,
): string {
  const header = `| ${columns.map((column) => escapeMarkdownCell(column.header)).join(' | ')} |`
  const divider = `| ${columns.map(() => '---').join(' | ')} |`
  const body = rows.map(
    (row) =>
      `| ${columns.map((column) => escapeMarkdownCell(row[column.id])).join(' | ')} |`,
  )

  return [header, divider, ...body].join('\n')
}

async function buildXlsxBlob<TData>(
  columns: Array<DataExportColumn<TData>>,
  rows: Array<Record<string, unknown>>,
  sheetName: string,
): Promise<Blob> {
  const xlsx = await import('xlsx')
  const headerRow = columns.map((column) => column.header)
  const bodyRows = rows.map((row) =>
    columns.map((column) => normalizeXlsxValue(row[column.id])),
  )
  const sheet = xlsx.utils.aoa_to_sheet([headerRow, ...bodyRows])
  const book = xlsx.utils.book_new()

  xlsx.utils.book_append_sheet(book, sheet, sheetName)

  const buffer = xlsx.write(book, {
    bookType: 'xlsx',
    type: 'array',
  }) as ArrayBuffer

  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

function normalizeXlsxValue(
  value: unknown,
): string | number | boolean | Date | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (value instanceof Date) return value

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = fileName
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
