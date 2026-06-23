import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronsUpDown,
  LayoutTemplate,
  Loader2,
  Mail,
  Package,
} from 'lucide-react'

import {
  HtmlTemplateEditor,
  numberToWordsTR,
} from '@/components/docyrus/html-template-editor'
import { QuoteLineItems } from '@/components/quotes/quote-line-items'
import { QuoteEmailDialog } from '@/components/quotes/quote-email-dialog'
import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
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
import { useSetDetailBreadcrumbTitle } from '@/lib/detail-breadcrumb'
import {
  DEFAULT_TEMPLATE,
  MINIMAL_TEMPLATE,
  QUOTE_VARIABLES,
} from '@/components/quotes/quote-templates'

const DEFAULT_CURRENCY = 'TRY'

function getRelationName(
  value?: { name?: string } | string | null,
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
  docTitle: string
  validUntil: string
  billingEmail: string
  billingAddress: string
  intro: string
  terms: string
}

const EMPTY_DOC: QuoteDocFields = {
  docTitle: '',
  validUntil: '',
  billingEmail: '',
  billingAddress: '',
  intro: '',
  terms: '',
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

type CustomerOption = { id: string; name: string }

function CustomerPicker({
  value,
  selectedName,
  onSelect,
  invalid,
}: {
  value: string | null
  selectedName: string | null
  onSelect: (customer: CustomerOption) => void
  invalid?: boolean
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { data: companies } = useCompanies({ columns: ['id', 'name'] })

  const options = useMemo<Array<CustomerOption>>(
    () =>
      (companies ?? [])
        .filter((c: any) => c.id)
        .map((c: any) => ({ id: String(c.id), name: c.name || String(c.id) })),
    [companies],
  )

  const label =
    selectedName ?? options.find((o) => o.id === value)?.name ?? null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-invalid={invalid}
          className={cn(
            'w-full justify-between font-normal',
            invalid && 'border-destructive text-destructive',
          )}
        >
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
        align="start"
      >
        <Command>
          <CommandInput
            placeholder={t('quotes.searchCustomer', {
              defaultValue: 'Search customers…',
            })}
          />
          <CommandList>
            <CommandEmpty>
              {t('quotes.noCustomers', { defaultValue: 'No customers found' })}
            </CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.id}
                  value={o.name}
                  onSelect={() => {
                    onSelect(o)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 size-3.5',
                      value === o.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
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
 * the quote exists. Template picker swaps the editor body. Doc fields/template
 * persist per-quote in localStorage (server persistence pending).
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
  const TEMPLATE_PRESETS = useMemo(
    () => [
      {
        id: 'standard',
        name: t('quotes.templateNames.standard'),
        body: DEFAULT_TEMPLATE,
      },
      {
        id: 'minimal',
        name: t('quotes.templateNames.minimal'),
        body: MINIMAL_TEMPLATE,
      },
    ],
    [t],
  )
  const salesOrderCollection = useBaseCrmSalesOrderCollection()
  const search = useSearch({ strict: false }) as {
    organization?: string
    organizationName?: string
    deal?: string
  }

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
            'net_total',
          ],
          filters: {
            rules: [
              { field: 'related_sales_order', operator: '=', value: quoteId },
            ],
          },
          orderBy: 'created_on asc',
        }
      : undefined,
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

  const [doc, setDoc] = useState<QuoteDocFields>(() =>
    readStored(`quote-doc:${storageId}`, EMPTY_DOC),
  )

  const quoteTitle =
    doc.docTitle.trim() ||
    (isNew
      ? t('quotes.newQuote', { defaultValue: 'New quote' })
      : t('quotes.untitledQuote', { defaultValue: 'Teklif' }))
  useSetDetailBreadcrumbTitle(quoteTitle)
  const [template, setTemplate] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_TEMPLATE
    return (
      window.localStorage.getItem(`quote-template:${storageId}`) ||
      DEFAULT_TEMPLATE
    )
  })
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [mailOpen, setMailOpen] = useState(false)
  const [lineItemsOpen, setLineItemsOpen] = useState(false)

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

  const setField = (key: keyof QuoteDocFields) => (value: string) =>
    setDoc((prev) => ({ ...prev, [key]: value }))

  const customerEmail = doc.billingEmail || (company as any)?.email || ''

  const dataJson = useMemo(() => {
    const lineItems = (items ?? []).map((item: any) => ({
      name: getRelationName(item.product) ?? '',
      qty: Number(item.qty ?? 0),
      unitPrice: Number(item.unit_price ?? 0),
      discount: Number(item.discount ?? 0),
      taxRate: Number(item.tax_rate ?? 0),
      net: Number(item.net_total ?? 0),
      gross: Number(item.gross_total ?? item.total ?? 0),
    }))

    return JSON.stringify(
      {
        quote: {
          title: doc.docTitle || quoteTitle,
          no: '',
          date: formatDate(new Date().toISOString()),
          validUntil: doc.validUntil,
        },
        customer: {
          name: customerName ?? '',
          address: doc.billingAddress || (company as any)?.address || '',
          taxNumber: (company as any)?.tax_number ?? '',
          email: customerEmail,
          phone: (company as any)?.phone ?? '',
        },
        intro: doc.intro,
        terms: doc.terms,
        currency: DEFAULT_CURRENCY,
        lineItems,
        totals: {
          subtotal: Number(order?.sub_total ?? 0),
          tax: Number(order?.tax_total ?? 0),
          grandTotal: Number(order?.grand_total ?? 0),
        },
      },
      null,
      2,
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
    doc,
  ])

  const handleSave = async () => {
    if (!customerId) {
      toast.error(
        t('quotes.customerRequired', {
          defaultValue: 'Please select a customer first',
        }),
      )
      return
    }
    if (saving) return
    setSaving(true)
    try {
      if (isNew) {
        const created = await salesOrderCollection.create({
          organization: customerId,
          ...(search.deal ? { deal: search.deal } : {}),
        })
        const newId = String(created.id)
        moveStored(`quote-doc:new`, `quote-doc:${newId}`)
        moveStored(`quote-template:new`, `quote-template:${newId}`)
        queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
        toast.success(t('quotes.saved', { defaultValue: 'Quote saved' }))
        setJustSaved(true)
        void navigate({
          to: '/quotes/$quoteId/build',
          params: { quoteId: newId },
        })
      } else {
        await salesOrderCollection.update(id, { organization: customerId })
        queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
        queryClient.invalidateQueries({ queryKey: ['sales-orders', id] })
        toast.success(t('quotes.saved', { defaultValue: 'Quote saved' }))
        setJustSaved(true)
        window.setTimeout(() => setJustSaved(false), 2000)
      }
    } catch (error: any) {
      toast.error(
        error?.message ||
          t('quotes.saveFailed', { defaultValue: 'Failed to save quote' }),
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
            params={{ quoteId: id }}
          >
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 size-4" />
              {t('common.back', { defaultValue: 'Back' })}
            </Button>
          </Link>
          <h1 className="truncate text-sm font-semibold">{quoteTitle}</h1>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <LayoutTemplate className="size-4" />
                {t('quotes.templates', { defaultValue: 'Templates' })}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {TEMPLATE_PRESETS.map((preset) => (
                <DropdownMenuItem
                  key={preset.id}
                  onSelect={() => setTemplate(preset.body)}
                >
                  {preset.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={handleSave}
            disabled={saving}
            className={cn(justSaved && 'bg-emerald-600 hover:bg-emerald-600')}
          >
            {saving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : justSaved ? (
              <Check className="mr-2 size-4" />
            ) : null}
            {isNew
              ? t('quotes.createQuote', { defaultValue: 'Create quote' })
              : t('quotes.updateQuote', { defaultValue: 'Update' })}
          </Button>

          <Button
            variant="outline"
            size="icon"
            disabled={!canMail}
            title={
              canMail
                ? t('quotes.sendMail', { defaultValue: 'Send mail' })
                : t('quotes.saveBeforeMail', {
                    defaultValue: 'Create the quote to send mail',
                  })
            }
            onClick={() => setMailOpen(true)}
          >
            <Mail className="size-4" />
          </Button>
        </div>
      </div>

      {!ready ? (
        <Skeleton className="h-[36rem] w-full" />
      ) : (
        <div className="grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-[360px_minmax(0,1fr)]">
          {/* Left: customer, line items (high), then document fields. */}
          <div className="min-h-0 space-y-3 overflow-auto pr-1">
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
                  }}
                />
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
                    total: `${grandTotal.toLocaleString()} ${DEFAULT_CURRENCY}`,
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
                          defaultValue: 'Create the quote first',
                        })
                      : undefined
                  }
                  onClick={() => setLineItemsOpen(true)}
                >
                  <Package className="size-4" />
                  {t('quotes.editLineItems', {
                    defaultValue: 'Edit line items',
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
                    defaultValue: 'Document title',
                  })}
                >
                  <Input
                    value={doc.docTitle}
                    onChange={(e) => setField('docTitle')(e.target.value)}
                    placeholder={quoteTitle}
                  />
                </Field>
                <Field
                  label={t('quotes.validUntil', {
                    defaultValue: 'Valid until',
                  })}
                >
                  <Input
                    type="date"
                    value={doc.validUntil}
                    onChange={(e) => setField('validUntil')(e.target.value)}
                  />
                </Field>
                <Field
                  label={t('quotes.billingEmail', {
                    defaultValue: 'Billing email',
                  })}
                >
                  <Input
                    value={doc.billingEmail}
                    onChange={(e) => setField('billingEmail')(e.target.value)}
                    placeholder={(company as any)?.email ?? ''}
                  />
                </Field>
                <Field
                  label={t('quotes.billingAddress', {
                    defaultValue: 'Billing address',
                  })}
                >
                  <Textarea
                    value={doc.billingAddress}
                    onChange={(e) => setField('billingAddress')(e.target.value)}
                    placeholder={(company as any)?.address ?? ''}
                    rows={2}
                  />
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
                    defaultValue: 'Intro / header note',
                  })}
                >
                  <Textarea
                    value={doc.intro}
                    onChange={(e) => setField('intro')(e.target.value)}
                    rows={3}
                  />
                </Field>
                <Field
                  label={t('quotes.termsNote', {
                    defaultValue: 'Terms & conditions',
                  })}
                >
                  <Textarea
                    value={doc.terms}
                    onChange={(e) => setField('terms')(e.target.value)}
                    rows={3}
                  />
                </Field>
              </CardContent>
            </Card>
          </div>

          {/* Right: the real template editor. */}
          <div className="min-h-0 overflow-hidden">
            <HtmlTemplateEditor
              key={`${storageId}:${itemCount}:${company?.id ?? ''}`}
              value={template}
              onChange={setTemplate}
              data={dataJson}
              variables={QUOTE_VARIABLES}
              extraHelpers={{ numberToWordsTR }}
              defaultCurrency={DEFAULT_CURRENCY}
              defaultTab="preview"
              className="h-full"
              minHeight="100%"
            />
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
        }}
      >
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
        body={doc.intro}
      />
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
