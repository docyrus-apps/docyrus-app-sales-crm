import { type HandlebarsVariable } from '@/components/docyrus/html-template-editor'

/**
 * Quote Handlebars templates + merge variables for the build/compose screen.
 * Bodies are stored as backend Studio HTML templates and are also kept here as
 * the runtime fallback / seed source. They bind to the JSON `data` composed in
 * `quote-build.tsx` (`{{customer.*}}`, `{{#each lineItems}}`, `{{totals.*}}`).
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

export const DEFAULT_TEMPLATE = `<section style="font-family:Inter,Arial,sans-serif;color:#0f172a;line-height:1.45;background:#ffffff">
  <div style="border-radius:18px;overflow:hidden;border:1px solid #dbeafe;margin-bottom:22px">
    <div style="background:linear-gradient(135deg,#0f766e 0%,#0ea5e9 58%,#1d4ed8 100%);padding:26px 28px;color:white">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="vertical-align:top">
            <div style="display:inline-block;border:1px solid rgba(255,255,255,.55);border-radius:999px;padding:4px 10px;font-size:10px;letter-spacing:.16em;text-transform:uppercase;margin-bottom:12px">Quotation</div>
            <h1 style="font-size:32px;line-height:1.08;margin:0 0 8px;font-weight:800">{{#if quote.title}}{{quote.title}}{{else}}Quote{{/if}}</h1>
            <p style="margin:0;color:#dbeafe;font-size:13px">{{#if quote.no}}{{quote.no}} · {{/if}}{{#if quote.date}}{{quote.date}}{{else}}{{created_on}}{{/if}}{{#if quote.validUntil}} · Valid until {{quote.validUntil}}{{/if}}</p>
          </td>
          <td style="vertical-align:top;text-align:right;width:235px">
            <div style="display:inline-block;background:rgba(15,23,42,.28);border:1px solid rgba(255,255,255,.28);border-radius:14px;padding:12px 14px;text-align:left;color:white">
              <div style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#bfdbfe;margin-bottom:5px">Prepared for</div>
              <strong style="display:block;font-size:14px">{{#if customer.name}}{{customer.name}}{{else}}{{organization.name}}{{/if}}</strong>
              {{#if customer.email}}<span style="font-size:12px;color:#e0f2fe">{{customer.email}}</span><br/>{{/if}}
              {{#if customer.phone}}<span style="font-size:12px;color:#e0f2fe">{{customer.phone}}</span>{{/if}}
            </div>
          </td>
        </tr>
      </table>
    </div>
    <div style="display:flex;gap:14px;background:#f8fafc;padding:16px 18px">
      <div style="flex:1;border-radius:12px;background:white;border:1px solid #e2e8f0;padding:12px">
        <div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#64748b;margin-bottom:5px">Customer details</div>
        <strong style="display:block;color:#0f172a">{{#if customer.name}}{{customer.name}}{{else}}{{organization.name}}{{/if}}</strong>
        {{#if customer.address}}<span style="font-size:12px;color:#475569">{{customer.address}}</span><br/>{{/if}}
        {{#if customer.taxNumber}}<span style="font-size:12px;color:#475569">Tax no: {{customer.taxNumber}}</span>{{/if}}
      </div>
      <div style="width:240px;border-radius:12px;background:#ecfeff;border:1px solid #bae6fd;padding:12px">
        <div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#0369a1;margin-bottom:5px">Quote total</div>
        <div style="font-size:22px;font-weight:800;color:#0f766e">{{#if totals.grandTotal}}{{totals.grandTotal}}{{else}}{{grand_total}}{{/if}} {{currency}}</div>
        <div style="font-size:12px;color:#0e7490;margin-top:2px">{{#if status.name}}{{status.name}}{{else}}Tax included where applicable{{/if}}</div>
      </div>
    </div>
  </div>

  {{#if intro}}<div style="border-left:4px solid #0ea5e9;background:#f0f9ff;border-radius:12px;padding:12px 14px;margin-bottom:18px;color:#0f172a">{{intro}}</div>{{/if}}

  <h2 style="font-size:14px;margin:0 0 10px;color:#0f766e;letter-spacing:.08em;text-transform:uppercase">Line Items</h2>
  <div style="border:1px solid #dbeafe;border-radius:14px;overflow:hidden;font-size:12.5px">
    <div style="display:grid;grid-template-columns:minmax(0,1.7fr) 70px 105px 70px 115px;background:#0f766e;color:white;font-weight:700">
      <div style="padding:11px 12px">Product</div>
      <div style="padding:11px 12px;text-align:right">Qty</div>
      <div style="padding:11px 12px;text-align:right">Unit</div>
      <div style="padding:11px 12px;text-align:right">VAT</div>
      <div style="padding:11px 12px;text-align:right">Amount</div>
    </div>
    {{#each lineItems}}
    <div style="display:grid;grid-template-columns:minmax(0,1.7fr) 70px 105px 70px 115px;border-bottom:1px solid #e0f2fe">
      <div style="padding:11px 12px"><strong>{{name}}</strong></div>
      <div style="padding:11px 12px;text-align:right">{{qty}}</div>
      <div style="padding:11px 12px;text-align:right">{{unitPrice}} {{@root.currency}}</div>
      <div style="padding:11px 12px;text-align:right">%{{taxRate}}</div>
      <div style="padding:11px 12px;text-align:right;font-weight:700;color:#0f766e">{{gross}} {{@root.currency}}</div>
    </div>
    {{/each}}
  </div>

  <table style="width:100%;border-collapse:collapse;margin-top:18px">
    <tr>
      <td style="vertical-align:top;padding-right:18px">
        {{#if terms}}<div style="border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;font-size:12px;color:#475569"><strong style="display:block;color:#0f172a;margin-bottom:5px">Terms &amp; Conditions</strong>{{terms}}</div>{{/if}}
      </td>
      <td style="width:285px;vertical-align:top">
        <div style="border-radius:16px;background:#0f172a;color:white;padding:16px 18px">
          <div style="display:flex;justify-content:space-between;color:#cbd5e1;margin-bottom:7px"><span>Subtotal</span><span>{{#if totals.subtotal}}{{totals.subtotal}}{{else}}{{sub_total}}{{/if}} {{currency}}</span></div>
          <div style="display:flex;justify-content:space-between;color:#cbd5e1;margin-bottom:11px"><span>VAT</span><span>{{#if totals.tax}}{{totals.tax}}{{else}}{{tax_total}}{{/if}} {{currency}}</span></div>
          <div style="border-top:1px solid rgba(255,255,255,.2);padding-top:11px;display:flex;justify-content:space-between;font-size:16px;font-weight:800"><span>Total</span><span>{{#if totals.grandTotal}}{{totals.grandTotal}}{{else}}{{grand_total}}{{/if}} {{currency}}</span></div>
        </div>
      </td>
    </tr>
  </table>

  <p style="text-align:center;margin:26px 0 0;color:#0f766e;font-weight:700">Thank you for the opportunity.</p>
</section>`

export const EXECUTIVE_TEMPLATE = `<section style="font-family:Inter,Arial,sans-serif;color:#111827;line-height:1.45;background:#ffffff">
  <div style="background:#111827;color:white;border-radius:18px;padding:28px 30px 24px;margin-bottom:22px">
    <div style="height:5px;background:linear-gradient(90deg,#f59e0b,#eab308,#22c55e);border-radius:999px;margin-bottom:22px"></div>
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td style="vertical-align:top">
          <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#fde68a;margin-bottom:10px">Commercial Proposal</div>
          <h1 style="margin:0;font-size:34px;line-height:1.05;font-weight:800">{{#if quote.title}}{{quote.title}}{{else}}Quote{{/if}}</h1>
          <p style="margin:10px 0 0;color:#cbd5e1;font-size:13px">{{#if quote.no}}{{quote.no}} · {{/if}}{{#if quote.date}}{{quote.date}}{{else}}{{created_on}}{{/if}}{{#if quote.validUntil}} · Valid until {{quote.validUntil}}{{/if}}</p>
        </td>
        <td style="vertical-align:top;text-align:right;width:220px">
          <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#94a3b8;margin-bottom:8px">Total investment</div>
          <div style="font-size:24px;font-weight:800;color:#fef3c7">{{#if totals.grandTotal}}{{totals.grandTotal}}{{else}}{{grand_total}}{{/if}} {{currency}}</div>
        </td>
      </tr>
    </table>
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:22px">
    <tr>
      <td style="width:50%;vertical-align:top;padding-right:10px">
        <div style="border:1px solid #e5e7eb;border-radius:14px;padding:14px 16px;background:#fffdf7">
          <div style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#92400e;margin-bottom:6px">Prepared for</div>
          <strong style="display:block;font-size:15px;color:#111827">{{#if customer.name}}{{customer.name}}{{else}}{{organization.name}}{{/if}}</strong>
          {{#if customer.address}}<span style="font-size:12px;color:#4b5563">{{customer.address}}</span><br/>{{/if}}
          {{#if customer.email}}<span style="font-size:12px;color:#4b5563">{{customer.email}}</span><br/>{{/if}}
          {{#if customer.phone}}<span style="font-size:12px;color:#4b5563">{{customer.phone}}</span>{{/if}}
        </div>
      </td>
      <td style="width:50%;vertical-align:top;padding-left:10px">
        <div style="border:1px solid #e5e7eb;border-radius:14px;padding:14px 16px;background:#f8fafc">
          <div style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#475569;margin-bottom:6px">Quote details</div>
          <table style="width:100%;font-size:12px;color:#334155;border-collapse:collapse">
            <tr><td style="padding:2px 0;color:#64748b">Date</td><td style="text-align:right;padding:2px 0">{{#if quote.date}}{{quote.date}}{{else}}{{created_on}}{{/if}}</td></tr>
            <tr><td style="padding:2px 0;color:#64748b">Valid until</td><td style="text-align:right;padding:2px 0">{{quote.validUntil}}</td></tr>
            <tr><td style="padding:2px 0;color:#64748b">Tax no</td><td style="text-align:right;padding:2px 0">{{customer.taxNumber}}</td></tr>
          </table>
        </div>
      </td>
    </tr>
  </table>

  {{#if intro}}<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:14px;padding:13px 15px;margin-bottom:20px;color:#78350f">{{intro}}</div>{{/if}}

  <h2 style="font-size:13px;margin:0 0 9px;letter-spacing:.12em;text-transform:uppercase;color:#111827">Scope &amp; Pricing</h2>
  <div style="font-size:12.5px;border-top:2px solid #111827">
    <div style="display:grid;grid-template-columns:minmax(0,1.8fr) 70px 105px 70px 115px;font-weight:800;color:#111827">
      <div style="padding:10px 0;border-bottom:1px solid #e5e7eb">Description</div>
      <div style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:center">Qty</div>
      <div style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:right">Unit</div>
      <div style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:right">VAT</div>
      <div style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:right">Amount</div>
    </div>
    {{#each lineItems}}
    <div style="display:grid;grid-template-columns:minmax(0,1.8fr) 70px 105px 70px 115px;border-bottom:1px solid #e5e7eb">
      <div style="padding:13px 0"><strong>{{name}}</strong></div>
      <div style="padding:13px 0;text-align:center">{{qty}}</div>
      <div style="padding:13px 0;text-align:right">{{unitPrice}} {{@root.currency}}</div>
      <div style="padding:13px 0;text-align:right">%{{taxRate}}</div>
      <div style="padding:13px 0;text-align:right;font-weight:800">{{gross}} {{@root.currency}}</div>
    </div>
    {{/each}}
  </div>

  <div style="display:flex;justify-content:flex-end;margin-top:20px">
    <div style="width:320px;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden">
      <div style="padding:12px 15px;background:#f8fafc">
        <div style="display:flex;justify-content:space-between;margin-bottom:7px;color:#475569"><span>Subtotal</span><span>{{#if totals.subtotal}}{{totals.subtotal}}{{else}}{{sub_total}}{{/if}} {{currency}}</span></div>
        <div style="display:flex;justify-content:space-between;color:#475569"><span>VAT</span><span>{{#if totals.tax}}{{totals.tax}}{{else}}{{tax_total}}{{/if}} {{currency}}</span></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;background:#f59e0b;color:#111827;padding:14px 15px;font-weight:900;font-size:16px"><span>Total</span><span>{{#if totals.grandTotal}}{{totals.grandTotal}}{{else}}{{grand_total}}{{/if}} {{currency}}</span></div>
    </div>
  </div>

  {{#if terms}}<div style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:14px;font-size:12px;color:#4b5563"><strong style="color:#111827">Terms &amp; Conditions</strong><br/>{{terms}}</div>{{/if}}
</section>`

export const MINIMAL_TEMPLATE = `<section style="font-family:Inter,Arial,sans-serif;color:#27272a;line-height:1.45;background:#ffffff">
  <div style="border:1px solid #fed7aa;border-radius:18px;overflow:hidden;margin-bottom:20px">
    <div style="background:#fff7ed;padding:22px 24px;border-bottom:1px solid #fed7aa">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="vertical-align:top">
            <div style="display:inline-block;background:#fb7185;color:white;border-radius:999px;padding:4px 10px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:10px">Offer</div>
            <h1 style="font-size:28px;line-height:1.08;margin:0;color:#1f2937">{{#if quote.title}}{{quote.title}}{{else}}Quote{{/if}}</h1>
            <p style="margin:8px 0 0;color:#78716c;font-size:12px">{{#if customer.name}}{{customer.name}}{{else}}{{organization.name}}{{/if}} · {{#if quote.date}}{{quote.date}}{{else}}{{created_on}}{{/if}}{{#if quote.validUntil}} · {{quote.validUntil}}{{/if}}</p>
          </td>
          <td style="text-align:right;vertical-align:top;width:210px">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#9a3412;margin-bottom:5px">Grand total</div>
            <div style="font-size:23px;font-weight:900;color:#fb7185">{{#if totals.grandTotal}}{{totals.grandTotal}}{{else}}{{grand_total}}{{/if}} {{currency}}</div>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding:14px 20px;background:white">
      <table style="width:100%;border-collapse:collapse;font-size:12px;color:#57534e">
        <tr>
          <td style="width:55%;vertical-align:top">
            <strong style="display:block;color:#27272a">{{#if customer.name}}{{customer.name}}{{else}}{{organization.name}}{{/if}}</strong>
            {{#if customer.email}}<span>{{customer.email}}</span><br/>{{/if}}
            {{#if customer.phone}}<span>{{customer.phone}}</span>{{/if}}
          </td>
          <td style="text-align:right;vertical-align:top">
            {{#if customer.address}}<span>{{customer.address}}</span><br/>{{/if}}
            {{#if customer.taxNumber}}<span>Tax no: {{customer.taxNumber}}</span>{{/if}}
          </td>
        </tr>
      </table>
    </div>
  </div>

  {{#if intro}}<div style="border-radius:14px;background:#eef2ff;border:1px solid #c7d2fe;color:#312e81;padding:12px 14px;margin-bottom:18px">{{intro}}</div>{{/if}}

  <div style="display:grid;gap:8px;font-size:13px">
    {{#each lineItems}}
    <div style="display:grid;grid-template-columns:minmax(0,1fr) 150px">
      <div style="background:#fafafa;border:1px solid #e5e7eb;border-right:none;border-radius:12px 0 0 12px;padding:12px 14px">
        <strong style="display:block;color:#27272a">{{name}}</strong>
        <span style="font-size:12px;color:#71717a">{{qty}} x {{unitPrice}} {{@root.currency}} · VAT %{{taxRate}}</span>
      </div>
      <div style="background:#fafafa;border:1px solid #e5e7eb;border-left:none;border-radius:0 12px 12px 0;padding:12px 14px;text-align:right;font-weight:800;color:#4f46e5">{{gross}} {{@root.currency}}</div>
    </div>
    {{/each}}
  </div>

  <div style="margin-top:18px;display:flex;justify-content:flex-end">
    <div style="width:280px;border-radius:16px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;padding:16px 18px">
      <div style="display:flex;justify-content:space-between;color:#ddd6fe;margin-bottom:6px"><span>Subtotal</span><span>{{#if totals.subtotal}}{{totals.subtotal}}{{else}}{{sub_total}}{{/if}} {{currency}}</span></div>
      <div style="display:flex;justify-content:space-between;color:#ddd6fe;margin-bottom:10px"><span>VAT</span><span>{{#if totals.tax}}{{totals.tax}}{{else}}{{tax_total}}{{/if}} {{currency}}</span></div>
      <div style="display:flex;justify-content:space-between;border-top:1px solid rgba(255,255,255,.28);padding-top:10px;font-size:16px;font-weight:900"><span>Total</span><span>{{#if totals.grandTotal}}{{totals.grandTotal}}{{else}}{{grand_total}}{{/if}} {{currency}}</span></div>
    </div>
  </div>

  {{#if terms}}<div style="margin-top:20px;padding:12px 14px;border-radius:12px;background:#f5f5f4;color:#57534e;font-size:12px"><strong style="color:#27272a">Terms</strong><br/>{{terms}}</div>{{/if}}
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
  { name: 'totals.subtotal', label: 'Ara toplam', category: 'Tutarlar' },
  { name: 'totals.tax', label: 'KDV', category: 'Tutarlar' },
  { name: 'totals.grandTotal', label: 'Genel toplam', category: 'Tutarlar' },
  { name: 'lineItems', label: 'Kalemler (liste)', category: 'Tutarlar' }
]
