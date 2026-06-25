import { type HandlebarsVariable } from '@/components/docyrus/html-template-editor/types'

/**
 * Quote Handlebars templates + merge variables for the build/compose screen.
 *
 * ⚠️ EDITOR ROUND-TRIP CONSTRAINTS — the `HtmlTemplateEditor` deserializes the
 * template into Plate on mount and re-serializes it back (even for Preview/PDF).
 * Plate only preserves a subset of HTML. Verified against the real Plate
 * pipeline in quote-templates.test.ts, the rules are:
 *
 *   ✅ survive : <h1>-<h3>, <p>, <hr>, <blockquote>, <table>/<tr>/<td>/<th>,
 *                {{#each}} / {{#if}} / helpers, per-CELL `background-color`,
 *                text-align on an INNER <p>, and on LITERAL text only:
 *                <span style="color | background-color | font-size"> + marks.
 *   ❌ dropped : style on <div>/<tr>/<table> (gradients, radius, flex), inline
 *                cell BORDERS, cell WIDTH, AND — crucially — color / font-size
 *                wrapped around a {{variable}} (a variable keeps ONLY bold /
 *                italic / underline marks, never color or size).
 *
 * Consequences baked into these templates:
 *   • Big title = `<h1>{{quote.title}}</h1>` — size comes from the host <h1>
 *     rule, NOT a span (a sized span around the variable would be dropped).
 *   • Variable VALUES always render in the default dark color, so any cell that
 *     holds a value uses a LIGHT fill (readable). Strong dark/colored fills are
 *     used only behind LITERAL labels (e.g. table header "Açıklama" in white).
 *   • Table borders come from the host stylesheet (A4_PREVIEW_CSS / PDF_PAGE_CSS),
 *     never inline.
 *
 * Data (composed in `quote-build.tsx`): {{quote.*}} title/no/date/validUntil ·
 * {{customer.*}} name/address/taxNumber/email/phone · {{intro}} {{terms}} ·
 * {{currency}} {{locale}} · {{#each lineItems}} name/qty/unitPrice/discount/
 * taxRate/net/gross · {{totals.*}} subtotal/tax/grandTotal. Money →
 * `formatCurrency v currency locale` (₺1.234,50); grand total also spelled out
 * via `numberToWordsTR`. Per-line amount = `net` so the column sums to subtotal.
 * Labels are Turkish, fully editable in the Code/Visual tabs.
 *
 * @docyrus: [[features#Quotes (Teklif)]]
 */

export type QuoteTemplatePresetId = 'standard' | 'executive' | 'minimal'

export interface QuoteTemplatePreset {
  id: QuoteTemplatePresetId;
  backendTemplateId: string;
  nameKey: string;
  defaultName: string;
  descriptionKey: string;
  defaultDescription: string;
  body: string;
  default?: boolean;
}

/* {{#each}} data rows — all values render dark (variables can't be colored). */
function lineItemRows(): string {
  return `{{#each lineItems}}
<tr>
<td><p><span style="color:#94a3b8">{{add @index 1}}</span></p></td>
<td><p><strong>{{name}}</strong></p></td>
<td><p style="text-align:right">{{qty}}</p></td>
<td><p style="text-align:right">{{formatCurrency unitPrice @root.currency @root.locale}}</p></td>
<td><p style="text-align:right">{{#if discount}}%{{formatNumber discount @root.locale 0}}{{else}}—{{/if}}</p></td>
<td><p style="text-align:right">%{{formatNumber taxRate @root.locale 0}}</p></td>
<td><p style="text-align:right"><strong>{{formatCurrency net @root.currency @root.locale}}</strong></p></td>
</tr>
{{/each}}`
}

/*
 * Header row of the line-items table. `accent` fills the cells; labels are
 * LITERAL so they can be colored `labelColor` (e.g. white on a dark fill). 
 */
function lineItemHead(accent: string, labelColor: string): string {
  const th = (label: string, right: boolean) => `<th style="background-color:${accent}"><p${right ? ' style="text-align:right"' : ''}><span style="color:${labelColor}"><strong>${label}</strong></span></p></th>`

  return `<tr>
${th('#', false)}
${th('Açıklama', false)}
${th('Adet', true)}
${th('Birim Fiyat', true)}
${th('İsk.', true)}
${th('KDV', true)}
${th('Tutar', true)}
</tr>`
}

/*
 * Subtotal / KDV / grand-total table. `barBg` fills the grand-total row; its
 * value renders dark, so `barBg` must be a light/mid tint that keeps dark text
 * readable. `labelColor` colors the literal "Genel Toplam". 
 */
function totalsTable(barBg: string, labelColor: string): string {
  return `<table><tbody>
<tr><td><p><span style="color:#64748b">Ara Toplam</span></p></td><td><p style="text-align:right">{{formatCurrency totals.subtotal currency locale}}</p></td></tr>
<tr><td><p><span style="color:#64748b">KDV</span></p></td><td><p style="text-align:right">{{formatCurrency totals.tax currency locale}}</p></td></tr>
<tr><td style="background-color:${barBg}"><p><span style="color:${labelColor};font-size:15px"><strong>Genel Toplam</strong></span></p></td><td style="background-color:${barBg}"><p style="text-align:right"><strong>{{formatCurrency totals.grandTotal currency locale}}</strong></p></td></tr>
</tbody></table>`
}

/* Customer block — `label` literal is colored; values render dark. */
function customerBlock(labelColor: string, heading: string): string {
  return `<p><span style="color:${labelColor};font-size:11px"><strong>${heading}</strong></span></p>
{{#if customer.name}}<p><strong>{{customer.name}}</strong></p>{{/if}}
{{#if customer.address}}<p><span style="color:#475569">{{customer.address}}</span></p>{{/if}}
{{#if customer.email}}<p><span style="color:#475569">{{customer.email}}</span></p>{{/if}}
{{#if customer.phone}}<p><span style="color:#475569">{{customer.phone}}</span></p>{{/if}}
{{#if customer.taxNumber}}<p><span style="color:#475569">Vergi No: </span>{{customer.taxNumber}}</p>{{/if}}`
}

/* Date / quote-meta line — literal separators are colored, values render dark. */
const META_LINE = `<p><span style="color:#94a3b8">{{#if quote.no}}{{quote.no}} · {{/if}}{{#if quote.date}}{{quote.date}}{{/if}}{{#if quote.validUntil}} · Son geçerlilik {{quote.validUntil}}{{/if}}</span></p>`

/*
 * ──────────────────────────────────────────────────────────────────────────
 * 1) STANDARD — teal accent bar, teal table head, light-teal total bar.
 * ────────────────────────────────────────────────────────────────────────── 
 */
export const DEFAULT_TEMPLATE = `<section style="font-family:Inter,Arial,sans-serif">
<table><tbody><tr><td style="background-color:#0f766e"><p><span style="color:#ffffff;font-size:16px"><strong>FİYAT TEKLİFİ</strong></span><span style="color:#99f6e4"> · QUOTATION</span></p></td></tr></tbody></table>
<h1>{{#if quote.title}}{{quote.title}}{{else}}Teklif{{/if}}</h1>
${META_LINE}
<hr/>
${customerBlock('#0f766e', 'MÜŞTERİ')}
{{#if intro}}<blockquote>{{intro}}</blockquote>{{/if}}
<h3><span style="color:#0f766e">Kalemler</span></h3>
<table><tbody>
${lineItemHead('#0f766e', '#ffffff')}
${lineItemRows()}
</tbody></table>
${totalsTable('#ccfbf1', '#0f766e')}
<p><em><span style="color:#64748b">Yazıyla: {{numberToWordsTR totals.grandTotal currency}}</span></em></p>
{{#if terms}}<h3><span style="color:#0f766e">Şartlar &amp; Koşullar</span></h3><blockquote>{{terms}}</blockquote>{{/if}}
<hr/>
<p style="text-align:center"><span style="color:#0f766e"><strong>İş birliğiniz için teşekkür ederiz.</strong></span></p>
</section>`

/*
 * ──────────────────────────────────────────────────────────────────────────
 * 2) EXECUTIVE — dark accent bar + dark table head, gold total bar.
 * ────────────────────────────────────────────────────────────────────────── 
 */
export const EXECUTIVE_TEMPLATE = `<section style="font-family:Inter,Arial,sans-serif">
<table><tbody><tr><td style="background-color:#111827"><p><span style="color:#fbbf24;font-size:16px"><strong>TİCARİ TEKLİF</strong></span><span style="color:#94a3b8"> · COMMERCIAL PROPOSAL</span></p></td></tr></tbody></table>
<h1>{{#if quote.title}}{{quote.title}}{{else}}Teklif{{/if}}</h1>
${META_LINE}
<hr/>
${customerBlock('#92400e', 'HAZIRLANAN TARAF')}
{{#if intro}}<blockquote>{{intro}}</blockquote>{{/if}}
<h3><span style="color:#111827">Kapsam &amp; Fiyatlandırma</span></h3>
<table><tbody>
${lineItemHead('#111827', '#ffffff')}
${lineItemRows()}
</tbody></table>
${totalsTable('#f59e0b', '#111827')}
<p><em><span style="color:#6b7280">Yazıyla: {{numberToWordsTR totals.grandTotal currency}}</span></em></p>
{{#if terms}}<h3><span style="color:#111827">Şartlar &amp; Koşullar</span></h3><blockquote>{{terms}}</blockquote>{{/if}}
<hr/>
<p style="text-align:center"><span style="color:#111827"><strong>İş birliğiniz için teşekkür ederiz.</strong></span></p>
</section>`

/*
 * ──────────────────────────────────────────────────────────────────────────
 * 3) MINIMAL — no accent bar; airy, light-indigo table head + total bar.
 * ────────────────────────────────────────────────────────────────────────── 
 */
export const MINIMAL_TEMPLATE = `<section style="font-family:Inter,Arial,sans-serif">
<p><span style="color:#4f46e5;font-size:11px"><strong>TEKLİF</strong></span></p>
<h1>{{#if quote.title}}{{quote.title}}{{else}}Teklif{{/if}}</h1>
${META_LINE}
<hr/>
${customerBlock('#4f46e5', 'MÜŞTERİ')}
{{#if intro}}<blockquote>{{intro}}</blockquote>{{/if}}
<h3><span style="color:#4f46e5">Kalemler</span></h3>
<table><tbody>
${lineItemHead('#eef2ff', '#4f46e5')}
${lineItemRows()}
</tbody></table>
${totalsTable('#eef2ff', '#4f46e5')}
<p><em><span style="color:#71717a">Yazıyla: {{numberToWordsTR totals.grandTotal currency}}</span></em></p>
{{#if terms}}<h3><span style="color:#4f46e5">Şartlar</span></h3><blockquote>{{terms}}</blockquote>{{/if}}
</section>`

export const QUOTE_TEMPLATE_PRESETS: Array<QuoteTemplatePreset> = [
  {
    id: 'standard',
    backendTemplateId: '019eeffe-d255-76d9-b100-aac3045d02e0',
    nameKey: 'quotes.templateNames.standard',
    defaultName: 'Standard',
    descriptionKey: 'quotes.wizard.standardTemplateDescription',
    defaultDescription: 'Classic quote layout with customer, table and totals.',
    body: DEFAULT_TEMPLATE,
    default: true
  },
  {
    id: 'executive',
    backendTemplateId: '019efbcc-9abd-7b58-8bcb-1e50e97c1ffe',
    nameKey: 'quotes.templateNames.executive',
    defaultName: 'Executive',
    descriptionKey: 'quotes.wizard.executiveTemplateDescription',
    defaultDescription: 'Formal proposal style with a strong total section.',
    body: EXECUTIVE_TEMPLATE
  },
  {
    id: 'minimal',
    backendTemplateId: '019efbcc-9c67-76dd-86c7-b1bafafa5533',
    nameKey: 'quotes.templateNames.minimal',
    defaultName: 'Simple',
    descriptionKey: 'quotes.wizard.minimalTemplateDescription',
    defaultDescription: 'Compact quote layout focused on lines and total.',
    body: MINIMAL_TEMPLATE
  }
]

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
