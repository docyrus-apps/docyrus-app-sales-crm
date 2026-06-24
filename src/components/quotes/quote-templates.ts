import { type HandlebarsVariable } from '@/components/docyrus/html-template-editor'

/**
 * Quote Handlebars templates + merge variables for the build/compose screen.
 * Bodies bind to the JSON `data` composed in `quote-build.tsx`
 * (`{{customer.*}}`, `{{#each lineItems}}`, `{{totals.*}}`). `formatCurrency` is
 * an editor engine helper; `numberToWordsTR` is registered via `extraHelpers`.
 *
 * @docyrus: [[features#Quotes (Teklif)]]
 */

export const DEFAULT_TEMPLATE = `<h1 style="font-size:22px;margin:0 0 4px">{{quote.title}}</h1>
<p style="color:#666;margin:0 0 16px">{{#if quote.no}}{{quote.no}} · {{/if}}{{quote.date}}{{#if quote.validUntil}} · Geçerlilik: {{quote.validUntil}}{{/if}}</p>
<p><strong>{{customer.name}}</strong><br/>{{customer.address}}{{#if customer.taxNumber}}<br/>Vergi No: {{customer.taxNumber}}{{/if}}</p>
{{#if intro}}<p style="margin:12px 0">{{intro}}</p>{{/if}}
<table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:12px">
<thead><tr style="background:#f3f4f6">
<th style="text-align:left;padding:6px 8px;border-bottom:1px solid #e5e7eb">Ürün</th>
<th style="text-align:right;padding:6px 8px;border-bottom:1px solid #e5e7eb">Adet</th>
<th style="text-align:right;padding:6px 8px;border-bottom:1px solid #e5e7eb">Birim Fiyat</th>
<th style="text-align:right;padding:6px 8px;border-bottom:1px solid #e5e7eb">KDV %</th>
<th style="text-align:right;padding:6px 8px;border-bottom:1px solid #e5e7eb">Tutar</th>
</tr></thead>
<tbody>
{{#each lineItems}}
<tr>
<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0">{{name}}</td>
<td style="text-align:right;padding:6px 8px;border-bottom:1px solid #f0f0f0">{{qty}}</td>
<td style="text-align:right;padding:6px 8px;border-bottom:1px solid #f0f0f0">{{formatCurrency unitPrice @root.currency}}</td>
<td style="text-align:right;padding:6px 8px;border-bottom:1px solid #f0f0f0">{{taxRate}}</td>
<td style="text-align:right;padding:6px 8px;border-bottom:1px solid #f0f0f0">{{formatCurrency gross @root.currency}}</td>
</tr>
{{/each}}
</tbody>
</table>
<p style="text-align:right;margin-top:12px">Ara Toplam: {{formatCurrency totals.subtotal currency}}<br/>KDV: {{formatCurrency totals.tax currency}}<br/><strong>Genel Toplam: {{formatCurrency totals.grandTotal currency}}</strong></p>
{{#if terms}}<div style="margin-top:20px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:12px;color:#555"><strong>Şartlar &amp; Koşullar</strong><br/>{{terms}}</div>{{/if}}`

export const MINIMAL_TEMPLATE = `<h2 style="margin:0 0 2px">{{quote.title}}</h2>
<p style="color:#777;margin:0 0 14px;font-size:13px">{{customer.name}} · {{quote.date}}</p>
{{#if intro}}<p style="margin:0 0 14px">{{intro}}</p>{{/if}}
<table style="width:100%;border-collapse:collapse;font-size:13px">
<tbody>
{{#each lineItems}}
<tr><td style="padding:4px 0;border-bottom:1px solid #eee">{{name}} <span style="color:#999">× {{qty}}</span></td><td style="padding:4px 0;border-bottom:1px solid #eee;text-align:right">{{formatCurrency gross @root.currency}}</td></tr>
{{/each}}
</tbody>
</table>
<p style="text-align:right;margin-top:10px;font-weight:bold">{{formatCurrency totals.grandTotal currency}}</p>
{{#if terms}}<p style="margin-top:16px;font-size:12px;color:#666">{{terms}}</p>{{/if}}`

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
  { name: 'totals.subtotal', label: 'Ara toplam', category: 'Tutarlar' },
  { name: 'totals.tax', label: 'KDV', category: 'Tutarlar' },
  { name: 'totals.grandTotal', label: 'Genel toplam', category: 'Tutarlar' },
  { name: 'lineItems', label: 'Kalemler (liste)', category: 'Tutarlar' }
]
