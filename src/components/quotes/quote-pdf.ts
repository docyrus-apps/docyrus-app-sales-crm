import { type RestApiClient } from '@docyrus/api-client'

import { numberToWordsTR } from '@/components/docyrus/html-template-editor'
import { createEditorTemplateEngine } from '@/components/docyrus/html-template-editor/lib/editor-template-engine'
import { htmlTemplateToPdf } from '@/components/docyrus/html-template-editor/lib/html-to-pdf'

import { type QuoteDocFields } from '@/components/quotes/quote-doc'

function relationName(
  value?: { name?: string } | string | null
): string | undefined {
  if (!value) return undefined
  if (typeof value === 'object') return value.name

  return value
}

export interface BuildQuoteDataInput {
  order?: Record<string, any> | null;
  items?: Array<Record<string, any>> | null;
  company?: Record<string, any> | null;
  doc: QuoteDocFields;
  customerName?: string | null;
  /** Fallback document title when the doc has none. */
  title: string;
  formatDate: (value: string) => string;
  locale: string;
  currency: string;
}

/**
 * Build the Handlebars data object handed to a quote template. The key order
 * mirrors what the build editor's data tab shows so the rendered PDF matches the
 * on-screen preview exactly.
 */
export function buildQuoteData(input: BuildQuoteDataInput) {
  const {
    order,
    items,
    company,
    doc,
    customerName,
    title,
    formatDate,
    locale,
    currency
  } = input

  const lineItems = (items ?? []).map(item => ({
    name: relationName(item.product) ?? '',
    qty: Number(item.qty ?? 0),
    unitPrice: Number(item.unit_price ?? 0),
    discount: Number(item.discount ?? 0),
    taxRate: Number(item.tax_rate ?? 0),
    net: Number(item.net_total ?? 0),
    gross: Number(item.gross_total ?? item.total ?? 0)
  }))

  const customerEmail = doc.billingEmail || company?.email || ''

  return {
    quote: {
      title: doc.docTitle || title,
      no: '',
      date: formatDate(order?.created_on ?? new Date().toISOString()),
      validUntil: doc.validUntil ? formatDate(doc.validUntil) : ''
    },
    customer: {
      name: customerName ?? '',
      address: doc.billingAddress || company?.address || '',
      taxNumber: company?.tax_number ?? '',
      email: customerEmail,
      phone: company?.phone ?? ''
    },
    intro: doc.intro,
    terms: doc.terms,
    currency,
    locale,
    lineItems,
    totals: {
      subtotal: Number(order?.sub_total ?? 0),
      tax: Number(order?.tax_total ?? 0),
      grandTotal: Number(order?.grand_total ?? 0)
    }
  }
}

/** Sanitized PDF file name derived from a quote title. */
export function quotePdfFileName(title: string): string {
  const safe = title.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'teklif'

  return `${safe}.pdf`
}

/**
 * Compile a quote template + data into A4 PDF bytes. Uses the same template
 * engine + helpers as the editor preview, so the output matches what the build
 * screen renders.
 */
export async function compileQuotePdfBytes(
  template: string,
  data: unknown
): Promise<Uint8Array> {
  const engine = createEditorTemplateEngine({
    extraHelpers: { numberToWordsTR }
  })
  const html = await engine.compileTpl(template)(data)

  return htmlTemplateToPdf(html)
}

/** Compile a quote into a ready-to-upload PDF `File`. */
export async function compileQuotePdfFile(
  template: string,
  data: unknown,
  fileName: string
): Promise<File> {
  const bytes = await compileQuotePdfBytes(template, data)
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })

  return new File([blob], fileName, { type: 'application/pdf' })
}

/** Storage-backed file descriptor returned by a record file upload. */
export interface UploadedRecordFile {
  /** Storage path (`file_name`) — pass this as the email attachment `filePath`. */
  filePath: string;
  fileName: string;
  mimeType: string;
  size: number;
}

/** Drill through `{ data }` envelope(s) and array wrappers to the file record. */
function pickUploadedFileRecord(response: unknown): Record<string, any> {
  let payload: any = response

  for (let depth = 0; depth < 3; depth += 1) {
    if (payload && typeof payload === 'object' && 'data' in payload) {
      payload = (payload as { data: unknown }).data
    } else {
      break
    }
  }

  if (Array.isArray(payload)) {
    return (payload[0] ?? {}) as Record<string, any>
  }

  return payload && typeof payload === 'object'
    ? (payload as Record<string, any>)
    : {}
}

/**
 * Upload a client-generated file to a record's attachments and return its
 * storage path, ready to be sent as an email attachment.
 *
 * Uses the record-scoped multipart endpoint with the `file` field and never
 * passes `?isCore`/`?publicFile`, so the file lands in the emailable `tenant`
 * bucket (files in core/public buckets cannot be emailed).
 */
export async function uploadRecordFile(
  client: RestApiClient,
  opts: {
    appSlug: string;
    dataSource: string;
    recordId: string;
    file: File;
  }
): Promise<UploadedRecordFile> {
  const form = new FormData()

  form.append('file', opts.file, opts.file.name)

  const response = await client.post(
    `/v1/apps/${opts.appSlug}/data-sources/${opts.dataSource}/items/${opts.recordId}/files/upload`,
    form
  )

  const record = pickUploadedFileRecord(response)
  const filePath = typeof record.file_name === 'string' ? record.file_name : ''

  if (!filePath) {
    throw new Error('Upload did not return a storage path')
  }

  return {
    filePath,
    fileName: opts.file.name,
    mimeType:
      typeof record.file_type === 'string' && record.file_type
        ? record.file_type
        : 'application/pdf',
    size: Number(record.file_size ?? opts.file.size)
  }
}
