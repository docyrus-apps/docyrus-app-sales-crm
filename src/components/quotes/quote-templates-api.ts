import { type RestApiClient } from '@docyrus/api-client'

/**
 * READ-ONLY access to the quote HTML templates registered in the backend
 * (Studio `tenant_html_template` rows bound to `sales_order`). The app does NOT
 * embed template bodies or write to these — it consumes them from the API:
 *
 *   GET .../templates            → metadata list (no body)
 *   GET .../templates/{id}       → full template incl. `body`
 *
 * Bodies are compiled + rendered client-side (Handlebars), so the registered
 * design (incl. gradients/divs) is preserved as-authored.
 *
 * @docyrus: [[architecture#Quote Builder & PDF]]
 */

const BASE = '/v1/apps/base_crm/data-sources/sales_order/templates'

export interface QuoteTemplateMeta {
  id: string;
  name: string;
  isDefault: boolean;
  pageFormat?: string | null;
  pageOrientation?: string | null;
}

export interface QuoteTemplateDetail extends QuoteTemplateMeta {
  body: string;
  styles?: string | null;
  headerTmpl?: string | null;
  footerTmpl?: string | null;
}

/** Unwrap the `{ success, data }` envelope (client.get may return either shape). */
function unwrap<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data
  }

  return response as T
}

/** True when the request failed because the templates route isn't deployed. */
export function isTemplatesRouteAbsent(error: unknown): boolean {
  const status =
    (error as { status?: number; statusCode?: number })?.status ??
    (error as { statusCode?: number })?.statusCode

  return status === 404
}

function toMeta(row: Record<string, unknown>): QuoteTemplateMeta {
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? row.id ?? ''),
    isDefault: Boolean(row.is_default ?? row.isDefault),
    pageFormat: (row.page_format ?? row.pageFormat ?? null) as string | null,
    pageOrientation: (row.page_orientation ?? row.pageOrientation ?? null) as
    | string
    | null
  }
}

/** List the registered quote templates (metadata only — default first). */
export async function listQuoteTemplates(
  client: RestApiClient
): Promise<Array<QuoteTemplateMeta>> {
  const raw = unwrap<Array<Record<string, unknown>>>(await client.get(BASE))
  const rows = Array.isArray(raw) ? raw : []
  const mapped = rows
    .filter(row => !row.archived)
    .map(toMeta)
    .filter(meta => meta.id)

  // Default template first, then by name.
  return mapped.sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1

    return a.name.localeCompare(b.name)
  })
}

/** Fetch a single template's full content (incl. `body`). */
export async function getQuoteTemplate(
  client: RestApiClient,
  id: string
): Promise<QuoteTemplateDetail> {
  const row = unwrap<Record<string, unknown>>(await client.get(`${BASE}/${id}`))

  return {
    ...toMeta(row),
    body: typeof row.body === 'string' ? row.body : '',
    styles: (row.styles ?? null) as string | null,
    headerTmpl: (row.header_tmpl ?? row.headerTmpl ?? null) as string | null,
    footerTmpl: (row.footer_tmpl ?? row.footerTmpl ?? null) as string | null
  }
}
