import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDocyrusClient } from '@docyrus/signin'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Briefcase,
  Building2,
  Check,
  ChevronsUpDown,
  FileText,
  LayoutTemplate,
  Loader2,
  Package
} from 'lucide-react'

import {
  PricingEnginePanel,
  type ILineItem,
  type IPricingDocumentData,
  type IProductCatalogItem,
  type ITotals
} from '@/components/docyrus/pricing-engine-panel'
import {
  buildLineItemRows,
  calculateTotals
} from '@/components/docyrus/pricing-engine-panel/lib/calculations'
import {
  AwesomeDialog,
  AwesomeDialogBody,
  AwesomeDialogFooter,
  AwesomeDialogHeader
} from '@/components/docyrus/awesome-dialog'
import { listQuoteTemplates } from '@/components/quotes/quote-templates-api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useCompanies } from '@/hooks/use-companies'
import { useDeal, useDeals } from '@/hooks/use-deals'
import { useProducts } from '@/hooks/use-products'
import {
  useBaseCrmSalesOrderCollection,
  useBaseCrmSalesOrderItemCollection
} from '@/collections'
import { useEnumEntities } from '@/hooks/use-enums'
import { findEnumIdByName } from '@/lib/crm-system-views'
import { useUiLocale } from '@/hooks/use-ui-locale'

const APP_SLUG = 'base_crm'
const DATA_SOURCE_SLUG = 'sales_order'
const DEFAULT_CURRENCY = 'TRY'
const DEFAULT_VAT_RATE = 20
const VAT_RATES = [
0,
1,
10,
20
]

type StepId = 'customer' | 'pricing' | 'template'

interface PickerOption {
  id: string;
  name: string;
  description?: string;
}


interface QuoteCreateWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialOrganizationId?: string;
  initialOrganizationName?: string;
  initialDealId?: string;
}

type RelationValue =
  | { id?: string | null; name?: string | null }
  | string
  | null

const ZERO_TOTALS: ITotals = {
  subtotal: 0,
  lineDiscountTotal: 0,
  globalDiscountAmount: 0,
  totalDiscount: 0,
  netTotal: 0,
  vatTotal: 0,
  adjustment: 0,
  grandTotal: 0
}

function makeInitialPricingDocument(): IPricingDocumentData {
  return {
    lineItems: [],
    globalDiscountPercent: 0,
    adjustment: 0,
    currency: {
      code: DEFAULT_CURRENCY,
      secondaryCurrencyCode: null,
      exchangeRate: 1
    },
    config: {
      showVatColumn: true,
      showDiscountColumn: true,
      showGrossColumn: true,
      showCategoryColumn: false,
      discountBeforeVat: true,
      enableVat: true,
      enableLineDiscount: true,
      enableGlobalDiscount: true,
      enableAdjustment: true,
      defaultVatRate: DEFAULT_VAT_RATE,
      vatRates: VAT_RATES,
      viewMode: 'net'
    },
    description: '',
    termsAndConditions: '',
    status: 'draft',
    totals: ZERO_TOTALS
  }
}

function getRelationId(value: RelationValue | undefined): string | null {
  if (!value) return null
  if (typeof value === 'string') return value

  return value.id ?? null
}

function getRelationName(value: RelationValue | undefined): string | null {
  if (!value) return null
  if (typeof value === 'string') return null

  return value.name ?? null
}

function getMultiRelationRows(
  value: unknown
): Array<{ id: string; name?: string | null }> {
  if (!Array.isArray(value)) return []

  const rows = new Map<string, { id: string; name?: string | null }>()

  for (const item of value) {
    if (typeof item === 'string') {
      if (item) rows.set(item, { id: item })
      continue
    }

    if (!item || typeof item !== 'object' || !('id' in item)) continue

    const row = item as { id?: string | null; name?: string | null }
    const id = row.id ?? ''

    if (id) rows.set(id, { id, name: row.name })
  }

  return Array.from(rows.values())
}

function isMeaningfulLineItem(line: ILineItem) {
  return Boolean(
    line.productId ||
    line.name.trim() ||
    line.unitPrice > 0 ||
    line.discountPercent > 0
  )
}

function isCompleteLineItem(line: ILineItem) {
  return Boolean(line.productId && line.quantity > 0)
}

export function QuoteCreateWizard({
  open,
  onOpenChange,
  initialOrganizationId,
  initialOrganizationName,
  initialDealId
}: QuoteCreateWizardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const client = useDocyrusClient()
  const salesOrderCollection = useBaseCrmSalesOrderCollection()
  const salesOrderItemCollection = useBaseCrmSalesOrderItemCollection()
  const locale = useUiLocale()

  const [step, setStep] = useState<StepId>('customer')
  const [pricingKey, setPricingKey] = useState(0)
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState<string | null>(null)
  const [dealId, setDealId] = useState<string | null>(null)
  const [dealName, setDealName] = useState<string | null>(null)
  const [docTitle, setDocTitle] = useState('')
  // Once the user edits the title manually, stop auto-deriving it.
  const titleTouched = useRef(false)
  const [validUntil, setValidUntil] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [pricingDocument, setPricingDocument] = useState<IPricingDocumentData>(
    () => makeInitialPricingDocument()
  )
  const [prefilledDealProductsFor, setPrefilledDealProductsFor] = useState<
    string | null
  >(null)
  const [isSaving, setIsSaving] = useState(false)

  const { data: companies = [] } = useCompanies({
    columns: [
'id',
'name',
'email',
'phone'
],
    orderBy: 'name ASC',
    limit: 200
  })
  const { data: deals = [] } = useDeals({
    columns: ['id', 'name', 'organization(id,name)'],
    orderBy: 'created_on DESC',
    limit: 200
  })
  const { data: initialDeal } = useDeal(initialDealId)
  const { data: products = [], isLoading: productsLoading } = useProducts({
    columns: [
'id',
'product_code',
'category',
'unit_price',
'tax',
'Unit'
],
    orderBy: 'product_code ASC',
    limit: 500
  })
  const { data: statuses = [] } = useEnumEntities('status', {
    appSlug: APP_SLUG,
    dataSourceSlug: DATA_SOURCE_SLUG
  })

  useEffect(() => {
    if (!open) return

    setStep('customer')
    setPricingKey(key => key + 1)
    setCustomerId(initialOrganizationId ?? null)
    setCustomerName(initialOrganizationName ?? null)
    setDealId(initialDealId ?? null)
    setDealName(null)
    setDocTitle('')
    titleTouched.current = false
    setValidUntil('')
    setTemplateId('')
    setPricingDocument(makeInitialPricingDocument())
    setPrefilledDealProductsFor(null)
    setIsSaving(false)
  }, [
initialDealId,
initialOrganizationId,
initialOrganizationName,
open
])

  /*
   * Auto-derive the document title from the chosen customer — "{Customer}
   * Price Quote" — until the user types their own title.
   */
  useEffect(() => {
    if (titleTouched.current) return
    setDocTitle(customerName ? `${customerName} Price Quote` : '')
  }, [customerName])

  useEffect(() => {
    if (!open || !initialDeal) return

    setDealName((initialDeal as any).name ?? null)

    const organizationId = getRelationId(initialDeal.organization)
    const organizationName = getRelationName(initialDeal.organization)

    if (!customerId && organizationId) setCustomerId(organizationId)
    if (!customerName && organizationName) setCustomerName(organizationName)
  }, [
customerId,
customerName,
initialDeal,
open
])

  const companyOptions = useMemo<Array<PickerOption>>(
    () => (companies as Array<any>)
        .filter(company => company.id)
        .map(company => ({
          id: String(company.id),
          name: company.name || String(company.id),
          description: company.email || company.phone || undefined
        })),
    [companies]
  )

  useEffect(() => {
    if (customerName || !customerId) return

    const selected = companyOptions.find(option => option.id === customerId)

    if (selected) setCustomerName(selected.name)
  }, [companyOptions, customerId, customerName])

  const allDealOptions = useMemo(
    () => (deals as Array<any>)
        .filter(deal => deal.id)
        .map(deal => ({
          id: String(deal.id),
          name: deal.name || String(deal.id),
          organizationId: getRelationId(deal.organization),
          description: getRelationName(deal.organization) ?? undefined
        })),
    [deals]
  )

  const dealOptions = useMemo<Array<PickerOption>>(
    () => allDealOptions
        .filter(deal => !customerId || deal.organizationId === customerId)
        .map(({ id, name, description }) => ({ id, name, description })),
    [allDealOptions, customerId]
  )

  useEffect(() => {
    if (!dealId) return

    const selectedDeal = allDealOptions.find(deal => deal.id === dealId)

    if (!selectedDeal) return
    if (customerId && selectedDeal.organizationId !== customerId) {
      setDealId(null)
      setDealName(null)

      return
    }
    setDealName(selectedDeal.name)
  }, [allDealOptions, customerId, dealId])

  const productCatalog = useMemo<Array<IProductCatalogItem>>(
    () => (products as Array<any>)
        .filter(product => product.id)
        .map(product => ({
          id: String(product.id),
          name:
            product.name ||
            product.product_code ||
            t('quotes.untitledProduct', { defaultValue: 'Product' }),
          categoryId: getRelationId(product.category) ?? undefined,
          category: getRelationName(product.category) ?? '',
          unitPrice: Number(product.unit_price ?? 0),
          vatRate: Number(product.tax ?? DEFAULT_VAT_RATE)
        })),
    [products, t]
  )

  useEffect(() => {
    if (!open || !initialDealId || !initialDeal) return
    if (prefilledDealProductsFor === initialDealId) return

    const relationRows = getMultiRelationRows(
      (initialDeal as any).deals_products_tags
    )

    if (relationRows.length === 0) {
      setPrefilledDealProductsFor(initialDealId)

      return
    }

    if (productsLoading) return

    if (pricingDocument.lineItems.some(isMeaningfulLineItem)) {
      setPrefilledDealProductsFor(initialDealId)

      return
    }

    const catalogById = new Map(
      productCatalog.map(product => [product.id, product])
    )
    const lineItems: Array<ILineItem> = relationRows.map((row, index) => {
      const catalogItem = catalogById.get(row.id)

      return {
        id: `deal-product-${row.id}`,
        position: index,
        productId: row.id,
        categoryId: catalogItem?.categoryId,
        name:
          catalogItem?.name ||
          row.name ||
          t('quotes.untitledProduct', { defaultValue: 'Product' }),
        category: catalogItem?.category ?? '',
        quantity: 1,
        unitPrice: catalogItem?.unitPrice ?? 0,
        vatRate: catalogItem?.vatRate ?? DEFAULT_VAT_RATE,
        discountPercent: 0
      }
    })
    const nextConfig = {
      ...pricingDocument.config,
      showCategoryColumn: lineItems.some(line => line.category.length > 0)
    }
    const nextRows = buildLineItemRows(lineItems, nextConfig)

    setPricingDocument(current => ({
      ...current,
      lineItems,
      config: nextConfig,
      totals: calculateTotals(
        nextRows,
        current.globalDiscountPercent,
        current.adjustment,
        nextConfig
      )
    }))
    setPricingKey(key => key + 1)
    setPrefilledDealProductsFor(initialDealId)
  }, [
    initialDeal,
    initialDealId,
    open,
    prefilledDealProductsFor,
    pricingDocument.config,
    pricingDocument.lineItems,
    productCatalog,
    productsLoading,
    t
  ])

  /*
   * Templates are READ from the backend (no embedded bodies); the wizard only
   * needs metadata to let the user pick which template the quote will use.
   */
  const { data: templateOptions = [] } = useQuery({
    queryKey: ['quote-templates'],
    queryFn: () => listQuoteTemplates(client!),
    enabled: !!client,
    retry: false,
    staleTime: 5 * 60_000
  })

  useEffect(() => {
    if (!open) return

    const currentExists = templateOptions.some(
      template => template.id === templateId
    )

    if (templateId && currentExists) return

    const nextTemplate =
      templateOptions.find(template => template.isDefault) ??
      templateOptions[0]

    if (nextTemplate) setTemplateId(nextTemplate.id)
  }, [open, templateId, templateOptions])

  const selectedTemplate =
    templateOptions.find(template => template.id === templateId) ??
    templateOptions.find(template => template.isDefault) ??
    templateOptions[0]

  const draftStatusId = useMemo(
    () => findEnumIdByName(statuses, ['Draft', 'Taslak']),
    [statuses]
  )

  const meaningfulLineItems = useMemo(
    () => pricingDocument.lineItems.filter(isMeaningfulLineItem),
    [pricingDocument.lineItems]
  )
  const hasValidPricing =
    meaningfulLineItems.length > 0 &&
    meaningfulLineItems.every(isCompleteLineItem)
  const lineRows = useMemo(
    () => buildLineItemRows(meaningfulLineItems, pricingDocument.config),
    [meaningfulLineItems, pricingDocument.config]
  )
  const totals = useMemo(
    () => calculateTotals(
        lineRows,
        pricingDocument.globalDiscountPercent,
        pricingDocument.adjustment,
        pricingDocument.config
      ),
    [
      lineRows,
      pricingDocument.adjustment,
      pricingDocument.config,
      pricingDocument.globalDiscountPercent
    ]
  )
  const steps = useMemo(
    () => [
      {
        id: 'customer' as const,
        label: t('quotes.wizard.stepCustomer', { defaultValue: 'Customer' }),
        icon: Building2
      },
      {
        id: 'pricing' as const,
        label: t('quotes.wizard.stepPricing', { defaultValue: 'Pricing' }),
        icon: Package
      },
      {
        id: 'template' as const,
        label: t('quotes.wizard.stepTemplate', { defaultValue: 'Template' }),
        icon: LayoutTemplate
      }
    ],
    [t]
  )
  const stepIndex = steps.findIndex(item => item.id === step)

  const validateStep = (targetStep = step) => {
    if (targetStep === 'customer' && !customerId) {
      toast.error(
        t('quotes.customerRequired', {
          defaultValue: 'Please select a customer first'
        })
      )

      return false
    }

    if (targetStep === 'pricing' && !hasValidPricing) {
      toast.error(
        meaningfulLineItems.length === 0
          ? t('quotes.wizard.pricingRequired', {
              defaultValue: 'Add at least one quote line first'
            })
          : t('quotes.wizard.productRequired', {
              defaultValue: 'Select a product for every quote line'
            })
      )

      return false
    }

    return true
  }

  const goNext = () => {
    if (!validateStep()) return

    const next = steps[stepIndex + 1]

    if (next) setStep(next.id)
  }

  const goPrevious = () => {
    const previous = steps[stepIndex - 1]

    if (previous) setStep(previous.id)
  }

  const handleCreate = async () => {
    if (!validateStep('customer') || !validateStep('pricing') || isSaving) {
      return
    }

    setIsSaving(true)

    try {
      const quoteDoc = {
        docTitle:
          docTitle.trim() ||
          (customerName ? `${customerName} Price Quote` : ''),
        validUntil,
        billingEmail: '',
        billingAddress: '',
        intro: '',
        terms: ''
      }
      const created = await salesOrderCollection.create({
        organization: customerId,
        ...(dealId ? { deal: dealId } : {}),
        ...(draftStatusId ? { status: draftStatusId } : {}),
        sub_total: totals.netTotal,
        tax_total: totals.vatTotal,
        grand_total: totals.grandTotal,
        quote_doc_json: quoteDoc,
        ...(selectedTemplate
          ? { quote_template_id: selectedTemplate.id }
          : {})
      })
      const quoteId = String(created.id)

      await Promise.all(
        meaningfulLineItems.map((line, index) => {
          const row = lineRows[index]
          const payload: Record<string, unknown> = {
            related_sales_order: quoteId,
            product: line.productId,
            qty: line.quantity,
            unit_price: line.unitPrice,
            discount: line.discountPercent,
            tax_rate: line.vatRate,
            total: row.lineSubtotal,
            net_total: row.netAfterDiscount,
            gross_total: row.grossTotal
          }

          return salesOrderItemCollection.create(payload)
        })
      )

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          `quote-doc:${quoteId}`,
          JSON.stringify(quoteDoc)
        )
        if (selectedTemplate) {
          window.localStorage.setItem(
            `quote-template-id:${quoteId}`,
            selectedTemplate.id
          )
        }
      }

      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      queryClient.invalidateQueries({ queryKey: ['sales-order-items'] })
      toast.success(t('quotes.saved', { defaultValue: 'Quote saved' }))
      void navigate({
        to: '/quotes/$quoteId',
        params: { quoteId }
      })
    } catch (error: any) {
      toast.error(
        error?.message ||
        t('quotes.saveFailed', { defaultValue: 'Failed to save quote' })
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AwesomeDialog
      open={open}
      onOpenChange={isSaving ? undefined : onOpenChange}
      container="modal"
      size="full"
      fullscreenable
      preventOutsideClose={isSaving}
      className="h-full max-h-full">
      <AwesomeDialogHeader
        title={t('quotes.wizard.title', { defaultValue: 'New quote' })}
        icon="huge file-02" />
      <AwesomeDialogBody className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <div className="flex shrink-0 justify-center border-b bg-muted/30 px-4 py-3">
          <div className="flex w-full max-w-2xl items-center">
            {steps.map((item, index) => {
              const Icon = item.icon
              const active = item.id === step
              const completed = index < stepIndex
              const enabled =
                index <= stepIndex ||
                (item.id === 'pricing' && Boolean(customerId)) ||
                (item.id === 'template' &&
                  Boolean(customerId) &&
                  hasValidPricing)

              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex min-w-0 items-center',
                    index < steps.length - 1 && 'flex-1'
                  )}>
                  <button
                    type="button"
                    disabled={!enabled || isSaving}
                    onClick={() => setStep(item.id)}
                    className={cn(
                      'flex min-w-0 items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors',
                      active && 'bg-background text-foreground shadow-xs',
                      !active && 'text-muted-foreground hover:bg-background/60',
                      !enabled && 'cursor-not-allowed opacity-40'
                    )}>
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px]',
                        active &&
                        'border-primary bg-primary text-primary-foreground',
                        completed &&
                        'border-emerald-500 bg-emerald-500 text-white'
                      )}>
                      {completed ? (
                        <Check className="size-3" />
                      ) : (
                        <Icon className="size-3.5" />
                      )}
                    </span>
                    <span className="truncate font-medium">{item.label}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <span
                      className={cn(
                        'mx-3 h-px min-w-8 flex-1 bg-border',
                        completed && 'bg-primary/50'
                      )} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {step === 'customer' && (
          <div className="min-h-0 flex-1 overflow-auto p-6">
            <div className="mx-auto flex min-h-full max-w-xl items-center">
              <div className="grid w-full gap-3 rounded-lg border bg-background p-4">
                <Field
                  label={t('quotes.customer', { defaultValue: 'Customer' })}
                  required>
                  <SearchableRelationPicker
                    value={customerId}
                    selectedName={customerName}
                    options={companyOptions}
                    placeholder={t('quotes.selectCustomer', {
                      defaultValue: 'Select customer'
                    })}
                    searchPlaceholder={t('quotes.searchCustomer', {
                      defaultValue: 'Search customers...'
                    })}
                    emptyLabel={t('quotes.noCustomers', {
                      defaultValue: 'No customers found'
                    })}
                    invalid={!customerId}
                    leadingIcon={<Building2 className="size-4 opacity-60" />}
                    onSelect={(option) => {
                      setCustomerId(option.id)
                      setCustomerName(option.name)
                    }} />
                </Field>

                <Field
                  label={t('quotes.wizard.linkedDeal', {
                    defaultValue: 'Linked deal'
                  })}>
                  <SearchableRelationPicker
                    value={dealId}
                    selectedName={dealName}
                    options={dealOptions}
                    placeholder={t('quotes.wizard.selectDeal', {
                      defaultValue: 'Select deal'
                    })}
                    searchPlaceholder={t('quotes.wizard.searchDeal', {
                      defaultValue: 'Search deals...'
                    })}
                    emptyLabel={t('quotes.wizard.noDeals', {
                      defaultValue: 'No deals found'
                    })}
                    disabled={!customerId}
                    leadingIcon={<Briefcase className="size-4 opacity-60" />}
                    onSelect={(option) => {
                      setDealId(option.id)
                      setDealName(option.name)
                    }} />
                </Field>

                <Field
                  label={t('quotes.docTitle', {
                    defaultValue: 'Document title'
                  })}>
                  <Input
                    value={docTitle}
                    onChange={(event) => {
                      titleTouched.current = true
                      setDocTitle(event.target.value)
                    }}
                    placeholder={
                      customerName
                        ? `${t('quotes.untitledQuote', {
                            defaultValue: 'Quote'
                          })} - ${customerName}`
                        : t('quotes.untitledQuote', { defaultValue: 'Quote' })
                    } />
                </Field>

                <Field
                  label={t('quotes.validUntil', {
                    defaultValue: 'Valid until'
                  })}>
                  <Input
                    type="date"
                    value={validUntil}
                    onChange={event => setValidUntil(event.target.value)} />
                </Field>
              </div>
            </div>
          </div>
        )}

        {step === 'pricing' && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-auto p-3">
              <PricingEnginePanel
                key={pricingKey}
                defaultValue={makeInitialPricingDocument()}
                locale={locale}
                productCatalog={productCatalog}
                showActions={false}
                showDescription={false}
                showTerms={false}
                showCategoryColumn={false}
                onDocumentChange={setPricingDocument}
                defaultCurrency={DEFAULT_CURRENCY}
                defaultVatRate={DEFAULT_VAT_RATE}
                vatRates={VAT_RATES}
                size="full"
                variant="bordered" />
            </div>
          </div>
        )}

        {step === 'template' && (
          <div className="min-h-0 flex-1 overflow-auto p-6">
            <div className="mx-auto flex min-h-full max-w-xl items-center">
              <div className="grid w-full gap-3">
                {templateOptions.map((template) => {
                  const selected = template.id === templateId

                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setTemplateId(template.id)}
                      className={cn(
                        'rounded-lg border bg-background p-3 text-left transition-colors hover:bg-muted/30',
                        selected && 'border-primary ring-2 ring-primary/15'
                      )}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                            <FileText className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-semibold">
                                {template.name}
                              </span>
                              {template.isDefault && (
                                <Badge variant="secondary" className="shrink-0">
                                  {t('quotes.wizard.defaultTemplate', {
                                    defaultValue: 'Default'
                                  })}
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              {(template.pageFormat ?? 'A4')} ·{' '}
                              {template.pageOrientation ?? 'portrait'}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            'flex size-6 shrink-0 items-center justify-center rounded-full border',
                            selected &&
                            'border-primary bg-primary text-primary-foreground'
                          )}>
                          {selected && <Check className="size-3.5" />}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </AwesomeDialogBody>
      <AwesomeDialogFooter className="justify-end">
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}>
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          {stepIndex > 0 && (
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={goPrevious}>
              {t('common.previous', { defaultValue: 'Previous' })}
            </Button>
          )}
          {step !== 'template' ? (
            <Button type="button" disabled={isSaving} onClick={goNext}>
              {t('common.next', { defaultValue: 'Next' })}
            </Button>
          ) : (
            <Button type="button" disabled={isSaving} onClick={handleCreate}>
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              {t('quotes.createQuote', { defaultValue: 'Create quote' })}
            </Button>
          )}
        </div>
      </AwesomeDialogFooter>
    </AwesomeDialog>
  )
}

function SearchableRelationPicker({
  value,
  selectedName,
  options,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  invalid,
  disabled,
  leadingIcon,
  onSelect
}: {
  value: string | null;
  selectedName: string | null;
  options: Array<PickerOption>;
  placeholder: string;
  searchPlaceholder: string;
  emptyLabel: string;
  invalid?: boolean;
  disabled?: boolean;
  leadingIcon?: ReactNode;
  onSelect: (option: PickerOption) => void;
}) {
  const [open, setOpen] = useState(false)
  const label =
    selectedName ?? options.find(option => option.id === value)?.name

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          aria-invalid={invalid}
          className={cn(
            'w-full justify-between font-normal',
            invalid && 'border-destructive text-destructive'
          )}>
          <span className="flex min-w-0 items-center gap-2">
            {leadingIcon}
            <span className={cn('truncate', !label && 'text-muted-foreground')}>
              {label ?? placeholder}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] min-w-[280px] overflow-hidden p-0"
        onWheelCapture={event => event.stopPropagation()}
        onWheel={event => event.stopPropagation()}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-[300px] overflow-y-auto overscroll-contain">
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {options.map(option => (
                <CommandItem
                  key={option.id}
                  value={`${option.name} ${option.description ?? ''} ${option.id}`}
                  onSelect={() => {
                    onSelect(option)
                    setOpen(false)
                  }}>
                  <Check
                    className={cn(
                      'mr-1 size-3.5',
                      value === option.id ? 'opacity-100' : 'opacity-0'
                    )} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{option.name}</span>
                    {option.description && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function Field({
  className,
  label,
  hint,
  required,
  children
}: {
  className?: string;
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs text-muted-foreground">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  )
}
