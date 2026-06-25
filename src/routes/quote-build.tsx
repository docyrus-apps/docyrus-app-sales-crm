import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronsUpDown,
  Download,
  LayoutTemplate,
  Loader2,
  Package,
  Send
} from 'lucide-react'

import {
  HtmlTemplateEditor,
  numberToWordsTR
} from '@/components/docyrus/html-template-editor'
import { createEditorTemplateEngine } from '@/components/docyrus/html-template-editor/lib/editor-template-engine'
import { htmlTemplateToPdf } from '@/components/docyrus/html-template-editor/lib/html-to-pdf'
import { QuoteLineItems } from '@/components/quotes/quote-line-items'
import { QuoteEmailDialog } from '@/components/quotes/quote-email-dialog'
import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useSalesOrder } from '@/hooks/use-sales-orders'
import { useSalesOrderItems } from '@/hooks/use-sales-order-items'
import { useCompanies, useCompany } from '@/hooks/use-companies'
import { useBaseCrmSalesOrderCollection } from '@/collections'
import { useDateFormat } from '@/lib/use-date-format'
import { useUiLocale } from '@/hooks/use-ui-locale'
import { useSetDetailBreadcrumbTitle } from '@/lib/detail-breadcrumb'
import {
  DEFAULT_TEMPLATE,
  QUOTE_TEMPLATE_PRESETS,
  QUOTE_VARIABLES
} from '@/components/quotes/quote-templates'

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

interface QuoteDocFields {
  docTitle: string;
  validUntil: string;
  billingEmail: string;
  billingAddress: string;
  intro: string;
  terms: string;
  templateBody: string;
  templateBodyTemplateId: string;
}

const EMPTY_DOC: QuoteDocFields = {
  docTitle: '',
  validUntil: '',
  billingEmail: '',
  billingAddress: '',
  intro: '',
  terms: '',
  templateBody: '',
  templateBodyTemplateId: ''
}

type TemplateOption = {
  id: string;
  backendTemplateId: string;
  name: string;
  description: string;
  isDefault: boolean;
  body: string;
}

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)

    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

function moveStored(fromKey: string, toKey: string) {
  if (typeof window === 'undefined') return
  try {
    const v = window.localStorage.getItem(fromKey)

    if (v != null) {
      window.localStorage.setItem(toKey, v)
      window.localStorage.removeItem(fromKey)
    }
  } catch {
    /* ignore */
  }
}

function isLegacyUnsafeTemplateDraft(value: string | null): value is string {
  return Boolean(
    value &&
    (value.includes('{{#if lineItems}}') ||
      (value.includes('{{#each lineItems}}') &&
        (value.includes('<tbody') || value.includes('</tbody>'))))
  )
}

function normalizeQuoteDoc(value: unknown): QuoteDocFields | null {
  if (!value) return null
  if (typeof value === 'string') {
    try {
      return normalizeQuoteDoc(JSON.parse(value))
    } catch {
      return null
    }
  }
  if (typeof value !== 'object') return null

  return { ...EMPTY_DOC, ...(value as Partial<QuoteDocFields>) }
}

type CustomerOption = { id: string; name: string }

function CustomerPicker({
  value,
  selectedName,
  onSelect,
  invalid
}: {
  value: string | null;
  selectedName: string | null;
  onSelect: (customer: CustomerOption) => void;
  invalid?: boolean;
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { data: companies } = useCompanies({ columns: ['id', 'name'] })

  const options = useMemo<Array<CustomerOption>>(
    () => (companies ?? [])
        .filter((c: any) => c.id)
        .map((c: any) => ({ id: String(c.id), name: c.name || String(c.id) })),
    [companies]
  )

  const label =
    selectedName ?? options.find(o => o.id === value)?.name ?? null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-invalid={invalid}
          className={cn(
            'w-full justify-between font-normal',
            invalid && 'border-destructive text-destructive'
          )}>
          <span className="flex min-w-0 items-center gap-2">
            <Building2 className="size-4 shrink-0 opacity-60" />
            <span className={cn('truncate', !label && 'text-muted-foreground')}>
              {label ??
                t('quotes.selectCustomer', { defaultValue: 'Select customer' })}
            </span>
          </span>
          <ChevronsUpDown className="ml-1 size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start">
        <Command>
          <CommandInput
            placeholder={t('quotes.searchCustomer', {
              defaultValue: 'Search customers…'
            })} />
          <CommandList>
            <CommandEmpty>
              {t('quotes.noCustomers', { defaultValue: 'No customers found' })}
            </CommandEmpty>
            <CommandGroup>
              {options.map(o => (
                <CommandItem
                  key={o.id}
                  value={o.name}
                  onSelect={() => {
                    onSelect(o)
                    setOpen(false)
                  }}>
                  <Check
                    className={cn(
                      'mr-2 size-3.5',
                      value === o.id ? 'opacity-100' : 'opacity-0'
                    )} />
                  <span className="truncate">{o.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Quote build / compose screen (create + edit). Left = customer picker, line
 * items (modal), document fields. Right = the Docyrus `HtmlTemplateEditor`.
 * "Create"/"Update" persists the sales_order; mail (composer) activates once
 * the quote exists. Template picker uses seeded Studio template IDs; doc
 * fields and selected template id persist on the quote record.
 *
 * @docyrus: [[features#Quotes (Teklif)]]
 */
export function QuoteBuild() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { quoteId } = useParams({ strict: false })
  const isNew = !quoteId
  const id = quoteId ?? ''
  const storageId = id || 'new'
  const { formatDate } = useDateFormat()
  const uiLocale = useUiLocale()
  /*
   * BCP-47 locale handed to the template format helpers. Defaults to tr-TR to
   * match the TRY default currency; English UI gets en-US.
   */
  const documentLocale = uiLocale === 'en' ? 'en-US' : 'tr-TR'
  const fallbackTemplateOptions = useMemo<Array<TemplateOption>>(
    () => QUOTE_TEMPLATE_PRESETS.map(preset => ({
        id: preset.id,
        backendTemplateId: preset.backendTemplateId,
        name: t(preset.nameKey, { defaultValue: preset.defaultName }),
        description: t(preset.descriptionKey, {
          defaultValue: preset.defaultDescription
        }),
        isDefault: Boolean(preset.default),
        body: preset.body
      })),
    [t]
  )
  const templateOptions = fallbackTemplateOptions
  const salesOrderCollection = useBaseCrmSalesOrderCollection()
  const search = useSearch({ strict: false })

  const { data: order, isLoading: orderLoading } = useSalesOrder(quoteId)
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
            rules: [{ field: 'related_sales_order', operator: '=', value: quoteId }]
          },
          orderBy: 'created_on asc'
        }
      : undefined
  )

  const [customerId, setCustomerId] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState<string | null>(null)

  useEffect(() => {
    if (!order) return
    setCustomerId(getRelationId(order.organization))
    setCustomerName(getRelationName(order.organization) ?? null)
  }, [order])

  // Prefill customer from the launching context (new quote from a company/deal).
  useEffect(() => {
    if (!isNew) return
    if (search.organization) setCustomerId(search.organization)
    if (search.organizationName) setCustomerName(search.organizationName)
  }, [isNew, search.organization, search.organizationName])

  const { data: company } = useCompany(customerId ?? undefined)

  const [doc, setDoc] = useState<QuoteDocFields>(() => readStored(`quote-doc:${storageId}`, EMPTY_DOC))
  const [docHydratedFromRecord, setDocHydratedFromRecord] = useState(false)

  const quoteTitle =
    doc.docTitle.trim() ||
    (isNew
      ? t('quotes.newQuote', { defaultValue: 'New quote' })
      : t('quotes.untitledQuote', { defaultValue: 'Teklif' }))

  useSetDetailBreadcrumbTitle(quoteTitle)
  // Sanitized file name for the header "Download PDF" action.
  const pdfFileName = `${
    quoteTitle.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'teklif'
  }.pdf`
  const [template, setTemplate] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_TEMPLATE

    return (
      window.localStorage.getItem(`quote-template:${storageId}`) ||
      DEFAULT_TEMPLATE
    )
  })
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    () => (typeof window === 'undefined'
        ? null
        : window.localStorage.getItem(`quote-template-id:${storageId}`))
  )
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [mailOpen, setMailOpen] = useState(false)
  const [lineItemsOpen, setLineItemsOpen] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)

  /*
   * The selected template resolves from the in-session selection first — so a
   * template click wins immediately — then falls back to the default preset.
   * `selectedTemplateId` may hold a preset id OR a backend id; both are matched.
   */
  const selectedTemplateOption = useMemo(
    () => (selectedTemplateId
        ? templateOptions.find(
            o => o.id === selectedTemplateId ||
              o.backendTemplateId === selectedTemplateId
          )
        : null) ??
        templateOptions.find(o => o.isDefault) ??
        templateOptions[0] ??
        null,
    [selectedTemplateId, templateOptions]
  )
  const selectedBackendTemplateId =
    selectedTemplateOption?.backendTemplateId ?? null

  // Hydrate doc + template body + selected template from the saved record once.
  useEffect(() => {
    if (!order || docHydratedFromRecord) return

    const recordDoc = normalizeQuoteDoc(order.quote_doc_json)

    if (recordDoc) setDoc(recordDoc)

    const savedId =
      typeof order.quote_template_id === 'string'
        ? order.quote_template_id
        : null

    if (savedId) setSelectedTemplateId(savedId)

    const savedBody = recordDoc?.templateBody

    if (savedBody && !isLegacyUnsafeTemplateDraft(savedBody)) {
      setTemplate(savedBody)
    } else if (savedId) {
      const opt = templateOptions.find(
        o => o.id === savedId || o.backendTemplateId === savedId
      )

      if (opt) setTemplate(opt.body)
    }
    setDocHydratedFromRecord(true)
  }, [docHydratedFromRecord, order, templateOptions])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(`quote-doc:${storageId}`, JSON.stringify(doc))
    } catch {
      /* ignore */
    }
  }, [doc, storageId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(`quote-template:${storageId}`, template)
    } catch {
      /* ignore */
    }
  }, [template, storageId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (selectedBackendTemplateId) {
        window.localStorage.setItem(
          `quote-template-id:${storageId}`,
          selectedBackendTemplateId
        )
      }
    } catch {
      /* ignore */
    }
  }, [selectedBackendTemplateId, storageId])

  const selectedTemplateName =
    selectedTemplateOption?.name ??
    t('quotes.templateNames.custom', { defaultValue: 'Custom' })

  const handleTemplateChange = (nextTemplate: string) => {
    setTemplate(nextTemplate)
  }

  const selectTemplate = (preset: TemplateOption) => {
    setSelectedTemplateId(preset.id)
    setTemplate(preset.body)
    setTemplatesOpen(false)
  }

  const setField = (key: keyof QuoteDocFields) => (value: string) => setDoc(prev => ({ ...prev, [key]: value }))

  const customerEmail = doc.billingEmail || (company as any)?.email || ''

  const dataJson = useMemo(() => {
    const lineItems = (items ?? []).map((item: any) => ({
      name: getRelationName(item.product) ?? '',
      qty: Number(item.qty ?? 0),
      unitPrice: Number(item.unit_price ?? 0),
      discount: Number(item.discount ?? 0),
      taxRate: Number(item.tax_rate ?? 0),
      net: Number(item.net_total ?? 0),
      gross: Number(item.gross_total ?? item.total ?? 0)
    }))

    return JSON.stringify(
      {
        quote: {
          title: doc.docTitle || quoteTitle,
          no: '',
          date: formatDate(
            (order as any)?.created_on ?? new Date().toISOString()
          ),
          validUntil: doc.validUntil ? formatDate(doc.validUntil) : ''
        },
        customer: {
          name: customerName ?? '',
          address: doc.billingAddress || (company as any)?.address || '',
          taxNumber: (company as any)?.tax_number ?? '',
          email: customerEmail,
          phone: (company as any)?.phone ?? ''
        },
        intro: doc.intro,
        terms: doc.terms,
        currency: DEFAULT_CURRENCY,
        locale: documentLocale,
        lineItems,
        totals: {
          subtotal: Number(order?.sub_total ?? 0),
          tax: Number(order?.tax_total ?? 0),
          grandTotal: Number(order?.grand_total ?? 0)
        }
      },
      null,
      2
    )
  }, [
    items,
    order,
    company,
    customerName,
    customerEmail,
    quoteTitle,
    id,
    formatDate,
    documentLocale,
    doc
  ])

  /*
   * Isolated engine for the header "Download PDF" action (same helpers as the
   * editor preview, so the downloaded PDF matches what's on screen).
   */
  const pdfEngine = useMemo(
    () => createEditorTemplateEngine({ extraHelpers: { numberToWordsTR } }),
    []
  )

  const handleDownloadPdf = useCallback(async () => {
    if (pdfBusy) return
    setPdfBusy(true)
    try {
      let data: unknown = {}

      try {
        data = JSON.parse(dataJson)
      } catch {
        data = {}
      }
      const html = await pdfEngine.compileTpl(template)(data)
      const bytes = await htmlTemplateToPdf(html)
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')

      anchor.href = url
      anchor.download = pdfFileName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      toast.error(
        t('quotes.pdfFailed', { defaultValue: 'PDF oluşturulamadı' })
      )
    } finally {
      setPdfBusy(false)
    }
  }, [
pdfBusy,
dataJson,
template,
pdfFileName,
pdfEngine,
t
])

  const handleSave = async () => {
    if (!customerId) {
      toast.error(
        t('quotes.customerRequired', {
          defaultValue: 'Please select a customer first'
        })
      )

      return
    }
    if (saving) return
    setSaving(true)
    try {
      const savedDoc = {
        ...doc,
        templateBody: template,
        templateBodyTemplateId:
          selectedBackendTemplateId ?? selectedTemplateId ?? ''
      }
      const quotePayload = {
        organization: customerId,
        quote_doc_json: savedDoc,
        ...(selectedBackendTemplateId
          ? { quote_template_id: selectedBackendTemplateId }
          : {})
      }

      if (isNew) {
        const created = await salesOrderCollection.create({
          ...quotePayload,
          ...(search.deal ? { deal: search.deal } : {})
        })
        const newId = String(created.id)

        moveStored(`quote-doc:new`, `quote-doc:${newId}`)
        moveStored(`quote-template-id:new`, `quote-template-id:${newId}`)
        moveStored(`quote-template:new`, `quote-template:${newId}`)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(
            `quote-doc:${newId}`,
            JSON.stringify(savedDoc)
          )
        }
        queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
        toast.success(t('quotes.saved', { defaultValue: 'Quote saved' }))
        setJustSaved(true)
        void navigate({
          to: '/quotes/$quoteId/build',
          params: { quoteId: newId }
        })
      } else {
        await salesOrderCollection.update(id, quotePayload)
        queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
        queryClient.invalidateQueries({ queryKey: ['sales-orders', id] })
        setDoc(savedDoc)
        toast.success(t('quotes.saved', { defaultValue: 'Quote saved' }))
        setJustSaved(true)
        window.setTimeout(() => setJustSaved(false), 2000)
      }
    } catch (error: any) {
      toast.error(
        error?.message ||
        t('quotes.saveFailed', { defaultValue: 'Failed to save quote' })
      )
    } finally {
      setSaving(false)
    }
  }

  const ready = isNew ? true : !orderLoading
  const itemCount = items?.length ?? 0
  const grandTotal = Number(order?.grand_total ?? 0)
  const canMail = !isNew

  return (
    <PageContainer className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="mb-3 flex flex-none flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to={isNew ? '/sales-orders' : '/quotes/$quoteId'}
            params={{ quoteId: id }}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 size-4" />
              {t('common.back', { defaultValue: 'Back' })}
            </Button>
          </Link>
          <h1 className="truncate text-sm font-semibold">{quoteTitle}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Popover open={templatesOpen} onOpenChange={setTemplatesOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="max-w-[260px] gap-1.5">
                <LayoutTemplate className="size-4 shrink-0" />
                <span className="shrink-0">
                  {t('quotes.templates', { defaultValue: 'Templates' })}
                </span>
                <span className="min-w-0 truncate rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {selectedTemplateName}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[340px] p-2">
              <div className="px-1.5 pb-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                  {t('quotes.selectedTemplate', {
                    defaultValue: 'Selected template'
                  })}
                </div>
                <div className="mt-0.5 truncate text-sm font-medium">
                  {selectedTemplateName}
                </div>
              </div>
              <div className="grid gap-1.5">
                {templateOptions.map((preset) => {
                  const selected = preset.id === selectedTemplateId

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => selectTemplate(preset)}
                      className={cn(
                        'rounded-lg border p-3 text-left transition-colors hover:bg-muted/40',
                        selected
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/15'
                          : 'border-border bg-background'
                      )}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="truncate text-sm font-semibold">
                              {preset.name}
                            </span>
                            {preset.isDefault && (
                              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                {t('quotes.wizard.defaultTemplate', {
                                  defaultValue: 'Default'
                                })}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                            {preset.description}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border',
                            selected &&
                            'border-primary bg-primary text-primary-foreground'
                          )}>
                          {selected && <Check className="size-3" />}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={pdfBusy}
            onClick={handleDownloadPdf}>
            {pdfBusy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {t('quotes.downloadPdf', { defaultValue: 'PDF İndir' })}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={!canMail}
            title={
              canMail
                ? t('quotes.sendMail', { defaultValue: 'Send mail' })
                : t('quotes.saveBeforeMail', {
                    defaultValue: 'Create the quote to send mail'
                  })
            }
            onClick={() => setMailOpen(true)}>
            <Send className="size-4" />
            {t('quotes.send', { defaultValue: 'Send' })}
          </Button>
        </div>
      </div>

      {!ready ? (
        <Skeleton className="h-[36rem] w-full" />
      ) : (
        <div className="grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* Left: customer, line items (high), then document fields. */}
          <div className="flex min-h-0 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 space-y-3 overflow-auto pr-1">
              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                    {t('quotes.customer', { defaultValue: 'Customer' })}
                  </div>
                  <CustomerPicker
                    value={customerId}
                    selectedName={customerName}
                    invalid={!customerId}
                    onSelect={(c) => {
                      setCustomerId(c.id)
                      setCustomerName(c.name)
                    }} />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                    {t('salesOrders.lineItems', { defaultValue: 'Line items' })}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('quotes.lineItemsSummary', {
                      defaultValue: '{{count}} item(s) · {{total}}',
                      count: itemCount,
                      total: `${grandTotal.toLocaleString()} ${DEFAULT_CURRENCY}`
                    })}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5"
                    disabled={isNew}
                    title={
                      isNew
                        ? t('quotes.createBeforeLineItems', {
                            defaultValue: 'Create the quote first'
                          })
                        : undefined
                    }
                    onClick={() => setLineItemsOpen(true)}>
                    <Package className="size-4" />
                    {t('quotes.editLineItems', {
                      defaultValue: 'Edit line items'
                    })}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                    {t('quotes.docSection', { defaultValue: 'Quote details' })}
                  </div>
                  <Field
                    label={t('quotes.docTitle', {
                      defaultValue: 'Document title'
                    })}>
                    <Input
                      value={doc.docTitle}
                      onChange={e => setField('docTitle')(e.target.value)}
                      placeholder={quoteTitle} />
                  </Field>
                  <Field
                    label={t('quotes.validUntil', {
                      defaultValue: 'Valid until'
                    })}>
                    <Input
                      type="date"
                      value={doc.validUntil}
                      onChange={e => setField('validUntil')(e.target.value)} />
                  </Field>
                  <Field
                    label={t('quotes.billingEmail', {
                      defaultValue: 'Billing email'
                    })}>
                    <Input
                      value={doc.billingEmail}
                      onChange={e => setField('billingEmail')(e.target.value)}
                      placeholder={(company as any)?.email ?? ''} />
                  </Field>
                  <Field
                    label={t('quotes.billingAddress', {
                      defaultValue: 'Billing address'
                    })}>
                    <Textarea
                      value={doc.billingAddress}
                      onChange={e => setField('billingAddress')(e.target.value)}
                      placeholder={(company as any)?.address ?? ''}
                      rows={2} />
                  </Field>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                    {t('quotes.content', { defaultValue: 'Content' })}
                  </div>
                  <Field
                    label={t('quotes.introNote', {
                      defaultValue: 'Intro / header note'
                    })}>
                    <Textarea
                      value={doc.intro}
                      onChange={e => setField('intro')(e.target.value)}
                      rows={3} />
                  </Field>
                  <Field
                    label={t('quotes.termsNote', {
                      defaultValue: 'Terms & conditions'
                    })}>
                    <Textarea
                      value={doc.terms}
                      onChange={e => setField('terms')(e.target.value)}
                      rows={3} />
                  </Field>
                </CardContent>
              </Card>
            </div>

            <div className="flex-none border-t bg-background/95 pt-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                className={cn(
                  'w-full',
                  justSaved && 'bg-emerald-600 hover:bg-emerald-600'
                )}>
                {saving ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : justSaved ? (
                  <Check className="mr-2 size-4" />
                ) : null}
                {isNew
                  ? t('quotes.createQuote', { defaultValue: 'Create quote' })
                  : t('quotes.updateQuote', { defaultValue: 'Update' })}
              </Button>
            </div>
          </div>

          {/* Right: the real template editor. */}
          <div className="min-h-0 overflow-hidden">
            <HtmlTemplateEditor
              key={`${storageId}:${selectedTemplateId ?? 'fallback'}:${itemCount}:${company?.id ?? ''}`}
              value={template}
              onChange={handleTemplateChange}
              data={dataJson}
              variables={QUOTE_VARIABLES}
              extraHelpers={{ numberToWordsTR }}
              defaultCurrency={DEFAULT_CURRENCY}
              defaultTab="preview"
              className="h-full"
              minHeight="100%" />
          </div>
        </div>
      )}

      {/* Near-full-page line items editor. */}
      <Dialog
        open={lineItemsOpen}
        onOpenChange={(open) => {
          setLineItemsOpen(open)
          if (!open) {
            queryClient.invalidateQueries({ queryKey: ['sales-order-items'] })
            queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
          }
        }}>
        <DialogContent className="flex h-[92vh] w-[96vw] max-w-[96vw] flex-col overflow-hidden p-4 sm:max-w-[1400px]">
          <DialogHeader>
            <DialogTitle>
              {t('salesOrders.lineItems', { defaultValue: 'Line items' })}
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-auto">
            {id && <QuoteLineItems quoteId={id} />}
          </div>
        </DialogContent>
      </Dialog>

      <QuoteEmailDialog
        open={mailOpen}
        onOpenChange={setMailOpen}
        to={customerEmail}
        subject={doc.docTitle || quoteTitle}
        body={doc.intro} />
    </PageContainer>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
