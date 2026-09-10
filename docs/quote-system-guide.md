# Quote (Teklif) System — Complete Developer Guide

> **Audience.** A developer who will rebuild the Quote flow on the **same Docyrus
> backend** but with a **different UI**. This document explains every moving part
> — data sources, API endpoints, template authoring, the merge-data contract,
> the pricing engine → line-item → template pipeline, client-side PDF, and the
> "email the PDF as an attachment" flow — plus a **ready-to-paste working
> template** you can install to verify your implementation end-to-end.
>
> Everything here is backend-truth: it does not depend on this app's specific
> React components. Where we cite a file, it's a *reference implementation* you
> can imitate, not a dependency.

---

## 0. TL;DR

A "quote" is **not a dedicated entity**. It is a `sales_order` record (header +
totals + a JSON document blob) plus its `sales_order_item` rows (priced lines).
An HTML/Handlebars **template** authored in Studio is fetched at runtime, merged
with a **quote data object** you build from the record, and rendered to a PDF
**entirely client-side**. The PDF can be **downloaded** or **uploaded to the
record and emailed as an attachment**.

```
                    ┌─────────────────────────────────────────────────────┐
   Studio (author)  │  tenant_html_template (bound to sales_order)         │
                    └───────────────┬─────────────────────────────────────┘
                                    │ GET .../sales_order/templates(/{id})
                                    ▼
  sales_order  ─┐      build data   ┌───────────────┐   Handlebars    ┌──────────┐
  + items      ─┼───▶  object  ───▶ │ template body │ ──── merge ────▶│  HTML    │
  + company    ─┘   (buildQuoteData) └───────────────┘                 └────┬─────┘
                                                                            │ html2canvas + pdf-lib
                                                                            ▼
                                                                       ┌──────────┐
                                                     download ◀────────│   PDF    │
                                                                       └────┬─────┘
                                     upload to record (tenant bucket)       │
                                     then email as attachment  ◀────────────┘
```

**Slugs used throughout:** app `base_crm`; data sources `sales_order`,
`sales_order_item`, `product`, `organization`. All REST paths are under
`/v1/apps/base_crm/data-sources/{slug}`.

---

## 1. The core idea & the story

### 1.1 Why `sales_order` instead of a "quote" entity

The platform in this build **cannot add new data endpoints** at will, so the
Quote feature **reuses `sales_order` + `sales_order_item`**. There is no `quote`
table. A quote *is* a sales order that also carries presentation data.

### 1.2 Data vs. document separation

Two concerns are kept apart on purpose:

- **Data (source of truth):** the priced line items (`sales_order_item`) and the
  header totals (`sales_order.sub_total/tax_total/grand_total`). Edited through a
  **pricing engine**.
- **Document (presentation):** the chosen template + document fields (title,
  validity, billing address, intro, terms) stored in `sales_order.quote_doc_json`.
  Rendered to PDF; never the source of the numbers.

### 1.3 Lifecycle (the happy path)

1. **Create** — pick a customer (organization), optionally a deal, set a title,
   add priced lines, choose a template → **write** a `sales_order` (+ its
   `sales_order_item` rows) with `quote_template_id` and `quote_doc_json`.
2. **Edit pricing** — the pricing engine reconciles line items and rewrites the
   header totals.
3. **Compose** — a build/preview screen renders the template with live data.
4. **Output** — download the PDF, or email it as an attachment.

In this app the screens are `/quotes/new` (create wizard), `/quotes/$id`
(detail + line-item editing), `/quotes/$id/build` (compose/preview). **Your UI
can collapse or reshape these freely** — the backend contract is identical.

---

## 2. Data model (data sources)

### 2.1 `sales_order` — the quote header

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | — |
| `organization` | relation → `organization` | **the customer.** Write as a plain id string. Reads back as `{id,name}` (expand with `organization(id,name,email,phone,…)`). |
| `deal` | relation → `deal` | optional origin deal. Plain id string on write. |
| `status` | enum/status | e.g. Draft. Reads back as `{id,name}`. |
| `sub_total` | number | = sum of line **net** (after discount, before tax). **Client-computed.** |
| `tax_total` | number | = sum of line tax. **Client-computed.** |
| `grand_total` | number | = net + tax. **Client-computed.** |
| `quote_template_id` | text | UUID of the selected `tenant_html_template`. |
| `quote_doc_json` | json | the presentation document (see below). |
| `record_owner`, `created_on`, `created_by`, `last_modified_*` | system | — |

> ⚠️ **There is no `autonumber_id`/quote number.** Derive a display title from
> `quote_doc_json.docTitle` → customer name → a literal fallback. Never show the
> raw UUID. `quote.no` in the data object is empty unless you add your own.

**`quote_doc_json` shape** (free-form JSON; this app uses):

```jsonc
{
  "docTitle": "Kiva Teknoloji Price Quote",
  "validUntil": "2026-07-31",            // ISO date (input value)
  "billingEmail": "satinalma@kiva.com.tr",
  "billingAddress": "Maslak Mah. No:1, İstanbul",
  "intro": "Talebiniz doğrultusunda…",   // free text shown in the doc
  "terms": "Fiyatlara KDV dahil değildir.",
  "templateBody": "<...optional per-quote edited HTML...>",
  "templateBodyTemplateId": "<template uuid the edited body belongs to>"
}
```

`templateBody` lets a quote carry a **per-record edited copy** of the template
that **wins over the backend body** — but only when
`templateBodyTemplateId === quote_template_id` (otherwise you fetch the backend
body). If you don't support per-quote edits, omit both.

### 2.2 `sales_order_item` — a priced line

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | — |
| `related_sales_order` | relation → `sales_order` | **required.** Plain id string on write. |
| `product` | relation → `product` | optional (catalog line). Plain id string on write; reads back as `{id,name}`. |
| `qty` | number | quantity |
| `unit_price` | number | unit price |
| `discount` | number | **percent** (e.g. `10` = 10%) |
| `tax_rate` | number | **percent** (e.g. `20` = 20% VAT) |
| `total` | number | line subtotal = `qty * unit_price` (pre-discount). **Client-computed.** |
| `net_total` | number | after discount, before tax. **Client-computed.** |
| `gross_total` | number | after discount **and** tax. **Client-computed.** |

> ⚠️ **The backend does NOT compute these totals.** `total`, `net_total`,
> `gross_total` (and the header `sub_total/tax_total/grand_total`) are computed
> **on the client** and written explicitly. If you skip them, they stay 0/null.

### 2.3 `product` — the catalog

Read with explicit columns `id, product_code, category, unit_price, tax, Unit`.
Notes: `category` is an **enum-backed** select (reads as `{id,name}`); **`name`
is not reliably exposed** — fall back to `product_code` for the label. `tax` is
the default VAT percent, `unit_price` the list price.

### 2.4 `organization` — the customer

Provides `name`, `address`, `tax_number`, `email`, `phone`, etc. Used to fill
the `customer.*` block of the quote data when the document fields are blank.

### 2.5 `tenant_html_template` — the templates (see §4)

Not accessed as normal `items`; exposed through a dedicated templates route
bound to `sales_order`.

---

## 3. API surface

All requests are authenticated (OAuth2 bearer). In this app they go through
`@docyrus/api-client` (`client.get/post/patch/delete`), which unwraps the
`{ success, data }` envelope inconsistently — **always handle both** `data` and
the bare payload.

### 3.1 Records (CRUD) — `sales_order` & `sales_order_item`

| Op | Method & path |
|---|---|
| List | `GET /v1/apps/base_crm/data-sources/{slug}/items` + query payload |
| Get | `GET  …/items/{recordId}?columns=…` |
| Create | `POST …/items` — body = field map |
| Update | `PATCH …/items/{recordId}` — body = partial field map |
| Delete | `DELETE …/items/{recordId}` |
| Delete many | `DELETE …/items` — body `{ "recordIds": [...] }` |

**Query payload** (list/get) supports column selection with relation expansion,
filtering, sorting, pagination, aggregation, formulas, pivots and child queries.
The subset this feature uses:

```jsonc
// GET .../sales_order_item/items
{
  "columns": ["id","product(id,name)","qty","unit_price","discount",
              "tax_rate","total","gross_total","net_total"],
  "filters": { "rules": [
    { "field": "related_sales_order", "operator": "=", "value": "<quoteId>" }
  ]},
  "orderBy": "created_on asc"
}
```

> Always send `columns` — **without it only `id` comes back.** Expand relations
> with `field(subfield,…)`. For the full payload spec (operators, aggregations,
> formulas, child queries) see `docs/docyrus-api-query-guide.md`.

**Create example (relations are plain id strings):**

```jsonc
// POST .../sales_order/items
{
  "organization": "<orgId>",
  "deal": "<dealId>",                 // optional
  "quote_template_id": "<templateId>",
  "quote_doc_json": { "docTitle": "…", "validUntil": "2026-07-31", "intro": "…" }
}
// then for each line — POST .../sales_order_item/items
{
  "related_sales_order": "<quoteId>",
  "product": "<productId>",           // optional
  "qty": 10, "unit_price": 1200, "discount": 10, "tax_rate": 20,
  "total": 12000, "net_total": 10800, "gross_total": 12960
}
```

### 3.2 Templates — read-only

```
GET /v1/apps/base_crm/data-sources/sales_order/templates        → metadata list
GET /v1/apps/base_crm/data-sources/sales_order/templates/{id}   → full body
```

List rows (snake_case): `id, name, is_default, page_format, page_orientation,
archived`. Detail adds: `body` (the HTML/Handlebars), `styles`, `header_tmpl`,
`footer_tmpl`. Sort default-first, filter out `archived`.

> **The app consumes templates read-only.** It never PATCHes template bodies —
> authoring/editing happens in **Studio** (see §4.1).

### 3.3 Files — upload the generated PDF to a record

```
POST /v1/apps/base_crm/data-sources/sales_order/items/{recordId}/files/upload
GET  …/items/{recordId}/files
DELETE …/items/{recordId}/files/{fileId}
```

Upload is **multipart/form-data**, form field **`file`** (singular). Do **not**
set `Content-Type` manually (let the runtime add the multipart boundary), and do
**not** pass `?isCore=true` / `?publicFile=true` — a plain record upload lands in
the **`tenant`** bucket, which is the only bucket the email endpoint can attach.
Limit: 40 MB/file; `application/pdf` is allowed.

Response `data` (snake_case) — keep **`file_name`** (the storage path):

```jsonc
{
  "id": "…", "file": "…",
  "file_name": "tenant-…/…/1719400000000-teklif.pdf",  // ← attachment filePath
  "file_type": "application/pdf", "file_size": 18234,
  "bucket": "tenant",                                    // ← must be "tenant"
  "signed_url": "https://…"                              // for viewing, NOT email
}
```

### 3.4 Email — send with the PDF attached

```
GET  /v1/messaging/email/accounts                       → sender accounts
POST /v1/messaging/email/accounts/{accountId}/send      → send
```

Accounts carry `id`, `kind` (`tenant`|`user`), `provider`, `senderEmail`,
`isUserAccessible`. Only `isUserAccessible` accounts can send.

Send body:

```jsonc
{
  "to": ["customer@example.com"],        // 1–50; cc/bcc/replyTo optional
  "subject": "Teklifiniz",               // ≤ 998 chars
  "body": "<p>Teklifimiz ektedir.</p>",  // HTML or text
  "attachments": [
    { "filePath": "<upload file_name>",  // storage path, NOT signed_url
      "fileName": "Teklif.pdf",          // display name (optional)
      "mimeType": "application/pdf" }
  ]
}
```

Attachment limits (stricter than upload): **≤ 10 files, 10 MB each, 25 MB total.**
Response: `{ messageId, provider, accepted, rejected }`.

---

## 4. Templates

### 4.1 Authoring (Studio) — the app only reads

Templates are `tenant_html_template` rows **bound to `sales_order`**, authored in
**Docyrus Studio** (UI, or the CLI). They are HTML + CSS with `{{Handlebars}}`
placeholders, plus page options (format/orientation/margins/header/footer/
filename) and an optional data-source binding.

CLI form (see the `docyrus-print-pdf-template-design` skill for the full flow):

```bash
docyrus studio create-html-template \
  --app-slug base_crm \
  --data-source-slug sales_order \
  --name "Quote Standard" \
  --is-default \
  --body "$(cat template.html)"
```

> If a given CLI build rejects the html-template subcommands, author it in the
> **Studio UI** instead — the app picks up whatever is bound to `sales_order`.
> Mark one template `is_default`; the app defaults to it.

### 4.2 The merge-data contract (THE most important part)

Your template is merged against a **quote data object** you assemble from the
record. This is the contract between *any* UI and *any* template. Shape:

```jsonc
{
  "quote":   { "title": "…", "no": "", "date": "02.07.2026", "validUntil": "31.07.2026" },
  "customer":{ "name": "…", "address": "…", "taxNumber": "…", "email": "…", "phone": "…" },
  "intro":   "free text",
  "terms":   "free text",
  "currency":"TRY",           // ISO code — drives formatCurrency
  "locale":  "tr-TR",         // BCP-47 — drives number/date formatting
  "lineItems": [
    { "name": "…", "qty": 10, "unitPrice": 1200,
      "discount": 10, "taxRate": 20,     // percents
      "net": 10800, "gross": 12960 }     // precomputed per line
  ],
  "totals":  { "subtotal": 15800, "tax": 3160, "grandTotal": 18960 }
}
```

**How it's assembled** (reference: `buildQuoteData` in
`src/components/quotes/quote-pdf.ts`):

| Data path | Source |
|---|---|
| `quote.title` | `quote_doc_json.docTitle` (fallback title) |
| `quote.date` | `sales_order.created_on`, formatted |
| `quote.validUntil` | `quote_doc_json.validUntil`, formatted |
| `customer.*` | organization relation + `quote_doc_json.billing*` overrides |
| `intro`, `terms` | `quote_doc_json` |
| `currency`, `locale` | app defaults (`TRY` / `tr-TR`; `en-US` when UI=en) |
| `lineItems[].name` | `sales_order_item.product.name` |
| `lineItems[].qty/unitPrice/discount/taxRate` | `qty`/`unit_price`/`discount`/`tax_rate` |
| `lineItems[].net` | `sales_order_item.net_total` |
| `lineItems[].gross` | `sales_order_item.gross_total` (fallback `total`) |
| `totals.subtotal/tax/grandTotal` | `sub_total`/`tax_total`/`grand_total` |

> **Line-item amounts are already computed** (net/gross per line, and the
> totals). Templates normally just **print** them — you don't have to recompute
> with helpers (though you can; see §4.3).

### 4.3 Handlebars helpers available

The render engine (reference: `createEditorTemplateEngine` in
`…/html-template-editor/lib/editor-template-engine.ts`, which wraps
`@docyrus/app-utils`' `createTemplateEngine`) registers these on top of standard
Handlebars (`{{#each}}`, `{{#if}}`, `{{else}}`, `@index`, `../parent`):

**Formatting**
- `formatCurrency value currency [locale]` → `₺1.250,00` / `$1,250.00`
  (locale defaults from currency: `TRY`→tr-TR, else en-US)
- `formatNumber value [locale] [fractionDigits]`
- `formatPercent value` → `5` → `%5`, `12.5` → `%12,5`
- `formatDate value "DD.MM.YYYY" [locale]` (tokens `DD MM MMM MMMM YYYY`)

**Arithmetic:** `multiply a b`, `add a b …`, `subtract a b`, `divide a b`

**Aggregation:** `sumProperty items 'key'`, `avgProperty`, `minProperty`,
`maxProperty`, `countItems items`

**Invoice math (recompute from raw fields if you prefer):**
`lineNet qty unitPrice discountPct`,
`lineTotal qty unitPrice discountPct taxPct`,
`sumLineNets items`, `sumLineTaxes items`, `sumGrandTotal items`
(these assume line fields named `qty/unitPrice/discountPct/taxPct`), plus keyed
variants (`sumLineNetsKeyed items qtyKey priceKey discountKey`, …) and a safe
expression summer `sumLineExpr items "qty*unitPrice*(1-discountPct/100)"`.

**Comparison:** `eq a b`, `gt a b`, `lt a b`

**Consumer extras:** anything you pass in — this app adds `numberToWordsTR`
(amount → Turkish words).

> Note the field-name mismatch: the built-in `sumLineNets`/`lineTotal` expect
> `discountPct`/`taxPct`, but the **data object** names them `discount`/`taxRate`
> and already provides `net`/`gross`/`totals`. Simplest and safest: **print the
> precomputed values** (`{{formatCurrency net currency}}`, `{{totals.grandTotal}}`).

### 4.4 Rendering the template (headless — no editor UI needed)

The authoring editor is optional. The **minimal, UI-agnostic** pipeline is:

```ts
import { createEditorTemplateEngine }
  from '@/components/docyrus/html-template-editor/lib/editor-template-engine'
import { htmlTemplateToPdf }
  from '@/components/docyrus/html-template-editor/lib/html-to-pdf'
import { numberToWordsTR } from '@/components/docyrus/html-template-editor'

const engine = createEditorTemplateEngine({ extraHelpers: { numberToWordsTR } })
const html   = await engine.compileTpl(templateBody)(quoteData)   // Handlebars merge
const bytes  = await htmlTemplateToPdf(html)                       // Uint8Array (A4 PDF)
```

`compileTpl` returns an **async** renderer (so `{{formula}}` / `{{repeat}}` work).
`htmlTemplateToPdf` needs a browser DOM (it rasterizes — see §6). In this app
these are wrapped as `compileQuotePdfBytes` / `compileQuotePdfFile` in
`src/components/quotes/quote-pdf.ts`.

### 4.5 Faithful rendering & the Plate round-trip trap

This app's authoring component (`HtmlTemplateEditor`) is built on **Plate**. If a
template is loaded into Plate's **Visual (WYSIWYG)** tab, it is deserialized →
re-serialized, and Plate **drops block-level styling on arbitrary `<div>`s**
(gradients, border-radius, flex, box-shadow) because it has no node for raw divs.
Inline text styles and per-cell table styling now survive, but div designs do not.

**Consequences for you:**
- If you **compile the raw body yourself** (§4.4) — the recommended path — there
  is **no round-trip**, so the template renders **verbatim / exactly as authored**.
- If you use this editor, configure it to **exclude the Visual tab**
  (`visibleTabs={['preview','code','data','pdf']}`) so it keeps the HTML verbatim.
- Because rendering is verbatim, a **`<style>` block inside the template body
  works** (it applies globally during capture). The example in §10 uses this.

### 4.6 Page CSS

The PDF/preview host applies base A4 chrome + typography and gives `th,td`
padding/alignment but **no forced cell border**. So a template should bring its
**own** borders/colors (inline or via its own `<style>` block). Don't rely on host
CSS for borders.

---

## 5. Optional UI: the `HtmlTemplateEditor`

If you reuse this app's editor as your compose surface, the key props:

```tsx
<HtmlTemplateEditor
  value={templateBody}          // raw HTML/Handlebars string
  onChange={setTemplateBody}    // edits (Code tab)
  data={JSON.stringify(quoteData, null, 2)}  // merge data (live)
  variables={QUOTE_VARIABLES}   // insert-variable popover catalog
  extraHelpers={{ numberToWordsTR }}
  defaultCurrency="TRY"
  visibleTabs={['preview','code','data','pdf']}  // NO 'visual' → verbatim render
  defaultTab="preview"
/>
```

Tabs: **preview** (rendered), **code** (edit raw HTML/Handlebars verbatim),
**data** (inspect/edit merge JSON), **pdf** (client-side raster preview).
`QUOTE_VARIABLES` (in `src/components/quotes/quote-templates.ts`) is just field
**metadata** for the popover — it mirrors the §4.2 contract, it is not a template.

Your different UI can skip all of this and use the headless pipeline (§4.4).

---

## 6. PDF generation (print)

PDF is produced **100% client-side, as a raster**:
`htmlTemplateToPdf(html)` (in `…/html-template-editor/lib/html-to-pdf.ts`) renders
the compiled HTML off-screen, captures it with **html2canvas-pro**, and slices the
tall canvas into **A4 pages** assembled with **pdf-lib**, returning `Uint8Array`.

Implications:
- **Text is not selectable** (it's an image). Fine for quotes; if you need vector
  text you'd add a server-side renderer — none exists in this API.
- Runs only in a browser (needs `document`).
- Download = wrap bytes in a `Blob({type:'application/pdf'})` → object URL →
  `<a download>`.

```ts
const bytes = await compileQuotePdfBytes(templateBody, quoteData)
const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
const a = Object.assign(document.createElement('a'), { href: url, download: 'Teklif.pdf' })
a.click(); URL.revokeObjectURL(url)
```

---

## 7. Pricing engine → line items → template

### 7.1 Editing prices

This app uses the vendored **`PricingEnginePanel`** (`@docyrus/pricing-engine-panel`).
You can use any UI; what matters is what you **persist**. Feed it a
`productCatalog` (mapped from `product`): each entry
`{ id, name, categoryId, category, unitPrice, vatRate }`. The panel emits an
`IPricingDocumentData` with `lineItems[]` and computed `totals`.

### 7.2 Saving (reconcile + compute totals)

Reference: `src/components/quotes/quote-line-items.tsx`. On save:

1. **Compute rows** — `buildLineItemRows(data.lineItems, data.config)` yields per
   line: `lineSubtotal` (pre-discount), `netAfterDiscount`, `grossTotal`.
2. **Update header totals** — `PATCH sales_order` with
   `sub_total = totals.netTotal`, `tax_total = totals.vatTotal`,
   `grand_total = totals.grandTotal`.
3. **Reconcile items** — diff current line ids vs. the originally loaded set:
   `DELETE` removed, `PATCH` existing, `POST` new. Each item payload:

```jsonc
{
  "related_sales_order": "<quoteId>",
  "product": "<productId>",            // omit for manual lines
  "qty": <quantity>, "unit_price": <unitPrice>,
  "discount": <discountPercent>, "tax_rate": <vatPercent>,
  "total": <lineSubtotal>, "net_total": <netAfterDiscount>, "gross_total": <grossTotal>
}
```

> **You compute and write every total.** The backend stores them verbatim.

### 7.3 Flowing into the template

Read the items back (§3.1), map to `lineItems[]` (§4.2), and the template's
`{{#each lineItems}}` prints them. Because `net`/`gross`/`totals` were persisted at
save time, the PDF matches the pricing screen exactly — no recomputation drift.

**Gotchas:** manual (non-catalog) line **names don't persist** (name comes from
the `product` relation — a manual line has no product, so no stored name);
`category` isn't stored on the item; `discount`/`tax_rate` are **percents**.

---

## 8. Email the quote PDF as an attachment

The "generate client-side → store on the record → email it" pattern
(reference: `QuoteEmailDialog` + `uploadRecordFile` in
`src/components/quotes/quote-pdf.ts`). On send:

```ts
// 1. compile the quote to a PDF File
const bytes = await compileQuotePdfBytes(templateBody, quoteData)
const file  = new File([bytes], 'Teklif.pdf', { type: 'application/pdf' })

// 2. upload to the sales_order record → tenant bucket (field name MUST be "file")
const form = new FormData(); form.append('file', file, file.name)
const res  = await client.post(
  `/v1/apps/base_crm/data-sources/sales_order/items/${quoteId}/files/upload`, form)
const fileName = (res.data ?? res).file_name        // storage path

// 3. send with the stored path as the attachment filePath
await client.post(`/v1/messaging/email/accounts/${accountId}/send`, {
  to: [customerEmail], subject, body,
  attachments: [{ filePath: fileName, fileName: 'Teklif.pdf', mimeType: 'application/pdf' }]
})
```

Rules that bite if ignored:
- **Field name `file`** (singular) for this single-file upload.
- **No `?isCore`/`?publicFile`** → must be the **`tenant`** bucket, or the send
  fails with "Failed to download attachment".
- **`filePath` = `file_name`**, never `signed_url`.
- **Upload on send**, not eagerly — otherwise abandoned composes litter the
  record with PDFs.
- The tenant must have an **accessible email account** (`GET …/email/accounts`);
  surface a clear error if none.

---

## 9. End-to-end walkthrough

```
1. CREATE
   POST sales_order        { organization, deal?, quote_template_id, quote_doc_json }
   POST sales_order_item × N (with computed total/net_total/gross_total)
   PATCH sales_order        { sub_total, tax_total, grand_total }

2. LOAD FOR COMPOSE
   GET sales_order/{id}?columns=organization(id,name,email,phone),sub_total,tax_total,
                                grand_total,created_on,quote_template_id,quote_doc_json
   GET sales_order_item/items?filters=related_sales_order=={id}&columns=product(id,name),
                                qty,unit_price,discount,tax_rate,total,gross_total,net_total
   GET organization/{orgId}                         (address/tax_number if needed)
   GET sales_order/templates                        (list, pick default or saved id)
   GET sales_order/templates/{templateId}           (body)

3. BUILD DATA  → buildQuoteData(...)  (§4.2)

4. RENDER      → engine.compileTpl(body)(data) → html → htmlTemplateToPdf(html) → bytes

5. OUTPUT
   (a) download: Blob → <a download>
   (b) email:   upload bytes to sales_order/{id}/files/upload → file_name
                POST email/accounts/{accountId}/send { attachments:[{filePath:file_name}] }
```

---

## 10. Working example template (verified)

A minimal, self-contained quote template that binds to the §4.2 contract. It
uses only standard Handlebars + `formatCurrency` / `formatPercent` / `add`, and
carries its **own `<style>`** (so it renders identically whether or not host CSS
is present). **Verified**: compiles with Handlebars against the sample data below
and renders every field.

### 10.1 Install

Save the HTML as `template.html` and create the template bound to `sales_order`:

```bash
docyrus studio create-html-template \
  --app-slug base_crm --data-source-slug sales_order \
  --name "Quote Simple (Örnek)" --is-default \
  --body "$(cat template.html)"
```

(Or paste the body into a new HTML/PDF template in the Studio UI, bound to
`sales_order`, marked default.) Then it appears in the app's template picker; load
a quote, and the preview/PDF should render it filled in.

### 10.2 Template body

```html
<style>
  .qw { font-family: Arial, Helvetica, sans-serif; color: #1e293b; font-size: 13px; line-height: 1.5; }
  .qw h1 { font-size: 24px; margin: 0 0 4px; color: #0f766e; }
  .qw .muted { color: #64748b; }
  .qw .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 16px; }
  .qw .meta { text-align: right; font-size: 12px; }
  .qw .cust { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; margin-bottom: 16px; }
  .qw .cust b { display: block; font-size: 14px; margin-bottom: 2px; }
  .qw table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; }
  .qw th, .qw td { padding: 8px 10px; border: 1px solid #e2e8f0; text-align: left; vertical-align: top; }
  .qw thead th { background: #0f766e; color: #ffffff; font-size: 12px; }
  .qw td.num, .qw th.num { text-align: right; white-space: nowrap; }
  .qw .totals { width: 280px; margin-left: auto; }
  .qw .totals td { border: none; padding: 4px 10px; }
  .qw .totals .grand td { border-top: 2px solid #0f766e; font-weight: bold; font-size: 15px; color: #0f766e; }
  .qw .note { margin: 14px 0; }
  .qw .terms { border-top: 1px dashed #cbd5e1; padding-top: 10px; margin-top: 20px; font-size: 12px; color: #475569; }
</style>

<div class="qw">
  <div class="head">
    <div>
      <h1>{{quote.title}}</h1>
      <div class="muted">{{customer.name}}</div>
    </div>
    <div class="meta">
      {{#if quote.no}}<div><span class="muted">Teklif No:</span> <b>{{quote.no}}</b></div>{{/if}}
      <div><span class="muted">Tarih:</span> {{quote.date}}</div>
      {{#if quote.validUntil}}<div><span class="muted">Geçerlilik:</span> {{quote.validUntil}}</div>{{/if}}
    </div>
  </div>

  <div class="cust">
    <b>{{customer.name}}</b>
    {{#if customer.address}}<div>{{customer.address}}</div>{{/if}}
    {{#if customer.taxNumber}}<div class="muted">Vergi No: {{customer.taxNumber}}</div>{{/if}}
    {{#if customer.email}}<div class="muted">{{customer.email}}</div>{{/if}}
    {{#if customer.phone}}<div class="muted">{{customer.phone}}</div>{{/if}}
  </div>

  {{#if intro}}<div class="note">{{intro}}</div>{{/if}}

  <table>
    <thead>
      <tr>
        <th style="width:32px;">#</th>
        <th>Açıklama</th>
        <th class="num">Miktar</th>
        <th class="num">Birim Fiyat</th>
        <th class="num">İskonto</th>
        <th class="num">KDV</th>
        <th class="num">Tutar</th>
      </tr>
    </thead>
    <tbody>
      {{#each lineItems}}
      <tr>
        <td>{{add @index 1}}</td>
        <td>{{name}}</td>
        <td class="num">{{qty}}</td>
        <td class="num">{{formatCurrency unitPrice ../currency}}</td>
        <td class="num">{{formatPercent discount}}</td>
        <td class="num">{{formatPercent taxRate}}</td>
        <td class="num">{{formatCurrency net ../currency}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <table class="totals">
    <tr><td>Ara Toplam</td><td class="num">{{formatCurrency totals.subtotal currency}}</td></tr>
    <tr><td>KDV</td><td class="num">{{formatCurrency totals.tax currency}}</td></tr>
    <tr class="grand"><td>Genel Toplam</td><td class="num">{{formatCurrency totals.grandTotal currency}}</td></tr>
  </table>

  {{#if terms}}
  <div class="terms">
    <div style="font-weight:bold;margin-bottom:2px;">Şartlar &amp; Koşullar</div>
    <div>{{terms}}</div>
  </div>
  {{/if}}
</div>
```

Notes:
- `../currency` inside `{{#each}}` reaches the root `currency` (Handlebars parent
  path). At the root level use `currency` directly.
- `{{add @index 1}}` numbers rows 1..N (the `add` helper drops Handlebars'
  trailing options arg, so it sums `@index + 1`).
- If your compose UI **round-trips through Plate's Visual tab**, this `<style>`
  block and the div layout will be stripped — render verbatim (§4.5) instead.

### 10.3 Sample data (feed this to verify)

```json
{
  "quote":   { "title": "Bulut Yazılım Aboneliği Teklifi", "no": "", "date": "02.07.2026", "validUntil": "31.07.2026" },
  "customer":{ "name": "Kiva Teknoloji A.Ş.", "address": "Maslak Mah. No:1, İstanbul", "taxNumber": "1234567890", "email": "satinalma@kiva.com.tr", "phone": "+90 212 000 00 00" },
  "intro":   "Talebiniz doğrultusunda hazırladığımız teklifimizi bilgilerinize sunarız.",
  "terms":   "Fiyatlarımıza KDV dahil değildir. Teklif 30 gün geçerlidir.",
  "currency":"TRY",
  "locale":  "tr-TR",
  "lineItems": [
    { "name": "Bulut CRM — Yıllık Abonelik", "qty": 10, "unitPrice": 1200, "discount": 10, "taxRate": 20, "net": 10800, "gross": 12960 },
    { "name": "Kurulum & Eğitim (tek seferlik)", "qty": 1, "unitPrice": 5000, "discount": 0, "taxRate": 20, "net": 5000, "gross": 6000 }
  ],
  "totals":  { "subtotal": 15800, "tax": 3160, "grandTotal": 18960 }
}
```

Expected: title + customer block, a 2-row table, and totals **Ara Toplam
₺15.800,00 · KDV ₺3.160,00 · Genel Toplam ₺18.960,00**.

---

## 11. Gotchas & constraints (checklist)

- [ ] **No quote entity** — it's `sales_order` (+ `sales_order_item`).
- [ ] **No auto quote number** — derive the title; never show the UUID.
- [ ] **Totals are client-computed** — write `total/net_total/gross_total` on items
      and `sub_total/tax_total/grand_total` on the header. The backend won't.
- [ ] **Relations write as plain id strings** (`organization`, `deal`, `product`,
      `related_sales_order`); they read back as `{id,name}` — expand in `columns`.
- [ ] **Always send `columns`** or you get only `id`.
- [ ] `discount` / `tax_rate` are **percents**.
- [ ] **Product `name` is not exposed** — fall back to `product_code`; manual line
      names don't persist.
- [ ] **Templates are read-only from the app** — author in Studio, bound to
      `sales_order`, one `is_default`.
- [ ] **Render verbatim** (compile the raw body) or **exclude Plate's Visual tab**,
      or div-level styling gets stripped.
- [ ] **Templates bring their own borders/colors** — host CSS forces none.
- [ ] **PDF is a client-side raster** — text isn't selectable; browser only.
- [ ] **Upload before emailing**, field **`file`**, **tenant bucket** (no
      isCore/publicFile), attachment `filePath` = **`file_name`**.
- [ ] **Email limits**: ≤10 files, 10 MB each, 25 MB total; needs an accessible
      account.

---

## 12. Reference implementation map (this app)

| Concern | File |
|---|---|
| Template read API | `src/components/quotes/quote-templates-api.ts` |
| Merge-field catalog | `src/components/quotes/quote-templates.ts` (`QUOTE_VARIABLES`) |
| Build data + compile + upload | `src/components/quotes/quote-pdf.ts` (`buildQuoteData`, `compileQuotePdfBytes/File`, `uploadRecordFile`) |
| Document JSON shape | `src/components/quotes/quote-doc.ts` (`QuoteDocFields`, `normalizeQuoteDoc`) |
| Headless PDF for a saved quote | `src/hooks/use-quote-pdf.ts` (`useQuotePdf`) |
| Template engine + helpers | `src/components/docyrus/html-template-editor/lib/editor-template-engine.ts`, `…/handlebars-helpers.ts` |
| Client-side PDF raster | `src/components/docyrus/html-template-editor/lib/html-to-pdf.ts` |
| Compose UI | `src/routes/quote-build.tsx` |
| Pricing → items persist | `src/components/quotes/quote-line-items.tsx` |
| Email + attachment UI | `src/components/quotes/quote-email-dialog.tsx` |
| Data hooks | `src/hooks/use-sales-orders.ts`, `use-sales-order-items.ts`, `use-companies.ts`, `use-products.ts` |

For the full query-payload spec see `docs/docyrus-api-query-guide.md`. For
authoring templates/emails via CLI see the `docyrus-print-pdf-template-design`
and `docyrus-email-template-design` skills.
```
