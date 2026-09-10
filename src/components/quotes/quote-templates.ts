import { type HandlebarsVariable } from '@/components/docyrus/html-template-editor/types'

/**
 * Merge-field catalog for the quote HTML-template editor's "insert variable"
 * popover. These describe the JSON `data` shape composed in `quote-build.tsx`
 * ({{quote.*}}, {{customer.*}}, {{#each lineItems}}, {{totals.*}}) — they are
 * field METADATA, not templates.
 *
 * The template bodies themselves are NOT embedded in the app — they are read
 * from the backend (Studio `tenant_html_template` rows bound to `sales_order`)
 * via `quote-templates-api.ts` and rendered client-side.
 *
 * @docyrus: [[features#Quotes (Teklif)]]
 */
export const QUOTE_VARIABLES: Array<HandlebarsVariable> = [
  { name: 'quote.title', label: 'Belge başlığı', category: 'Teklif' },
  { name: 'quote.no', label: 'Teklif no', category: 'Teklif' },
  { name: 'quote.date', label: 'Tarih', category: 'Teklif' },
  { name: 'quote.validUntil', label: 'Geçerlilik', category: 'Teklif' },
  { name: 'intro', label: 'Giriş notu', category: 'Teklif' },
  { name: 'terms', label: 'Şartlar', category: 'Teklif' },
  { name: 'customer.name', label: 'Müşteri adı', category: 'Müşteri' },
  { name: 'customer.address', label: 'Adres', category: 'Müşteri' },
  { name: 'customer.taxNumber', label: 'Vergi no', category: 'Müşteri' },
  { name: 'customer.email', label: 'E-posta', category: 'Müşteri' },
  { name: 'customer.phone', label: 'Telefon', category: 'Müşteri' },
  { name: 'currency', label: 'Para birimi', category: 'Tutarlar' },
  { name: 'locale', label: 'Yerel ayar', category: 'Tutarlar' },
  { name: 'totals.subtotal', label: 'Ara toplam', category: 'Tutarlar' },
  { name: 'totals.tax', label: 'KDV', category: 'Tutarlar' },
  { name: 'totals.grandTotal', label: 'Genel toplam', category: 'Tutarlar' },
  { name: 'lineItems', label: 'Kalemler (liste)', category: 'Tutarlar' }
]
