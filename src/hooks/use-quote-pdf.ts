import { useCallback, useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { useDocyrusClient } from '@docyrus/signin'

import { EMPTY_DOC, normalizeQuoteDoc } from '@/components/quotes/quote-doc'
import {
  buildQuoteData,
  compileQuotePdfFile,
  quotePdfFileName
} from '@/components/quotes/quote-pdf'
import { getQuoteTemplate } from '@/components/quotes/quote-templates-api'
import { useCompany } from '@/hooks/use-companies'
import { useSalesOrder } from '@/hooks/use-sales-orders'
import { useSalesOrderItems } from '@/hooks/use-sales-order-items'
import { useUiLocale } from '@/hooks/use-ui-locale'
import { useDateFormat } from '@/lib/use-date-format'

const DEFAULT_CURRENCY = 'TRY'

function getRelationName(
  value?: { name?: string } | string | null
): string | undefined {
  if (!value) return undefined
  if (typeof value === 'object') return value.name

  return value
}

function getRelationId(value?: { id?: string } | string | null): string | null {
  if (!value || typeof value !== 'object') return null

  return value.id ?? null
}

export interface UseQuotePdfResult {
  /** True once the record + selected template body are loaded. */
  ready: boolean;
  fileName: string;
  /** Compile the quote into a PDF `File` (matches the build screen output). */
  generate: () => Promise<File>;
}

/**
 * Loads a saved quote (record + line items + company + selected template body)
 * and exposes a `generate()` that compiles the same A4 PDF the build screen
 * renders. Lets screens without the live editor — e.g. Quote Detail's send-mail
 * action — attach the quote PDF.
 *
 * @docyrus: [[features#Quotes (Teklif)]]
 */
export function useQuotePdf(quoteId?: string): UseQuotePdfResult {
  const client = useDocyrusClient()
  const { formatDate } = useDateFormat()
  const uiLocale = useUiLocale()
  const locale = uiLocale === 'en' ? 'en-US' : 'tr-TR'

  const { data: order } = useSalesOrder(quoteId)
  const orgId = getRelationId(order?.organization)
  const { data: company } = useCompany(orgId ?? undefined)
  const { data: items } = useSalesOrderItems(
    quoteId
      ? {
          columns: [
            'id',
            'product(id,name)',
            'qty',
            'unit_price',
            'discount',
            'tax_rate',
            'total',
            'gross_total',
            'net_total'
          ],
          filters: {
            rules: [
              {
                field: 'related_sales_order',
                operator: '=',
                value: quoteId
              }
            ]
          },
          orderBy: 'created_on asc'
        }
      : undefined
  )

  const doc = useMemo(
    () => normalizeQuoteDoc(order?.quote_doc_json) ?? EMPTY_DOC,
    [order?.quote_doc_json]
  )

  const templateId =
    typeof order?.quote_template_id === 'string'
      ? order.quote_template_id
      : null

  // A per-quote saved body (for the same template) wins over the backend body.
  const savedBody =
    doc.templateBody && doc.templateBodyTemplateId === templateId
      ? doc.templateBody
      : null

  const { data: templateDetail } = useQuery({
    queryKey: ['quote-template-detail', templateId],
    queryFn: () => getQuoteTemplate(client!, templateId!),
    enabled: !!client && !!templateId && !savedBody,
    staleTime: 5 * 60_000
  })

  const templateBody = savedBody ?? templateDetail?.body ?? ''
  const customerName = getRelationName(order?.organization) ?? null
  const quoteTitle = doc.docTitle || customerName || 'Teklif'
  const fileName = quotePdfFileName(quoteTitle)
  const ready = !!order && !!templateBody

  const generate = useCallback(() => {
    const data = buildQuoteData({
      order,
      items,
      company,
      doc,
      customerName,
      title: quoteTitle,
      formatDate,
      locale,
      currency: DEFAULT_CURRENCY
    })

    return compileQuotePdfFile(templateBody, data, fileName)
  }, [
    order,
    items,
    company,
    doc,
    customerName,
    quoteTitle,
    formatDate,
    locale,
    templateBody,
    fileName
  ])

  return { ready, fileName, generate }
}
