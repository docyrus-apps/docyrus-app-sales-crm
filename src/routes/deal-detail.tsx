/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  ArrowLeft,
  FileText,
  MessageSquare,
  Package,
  Pencil,
  ShoppingCart,
} from 'lucide-react'
import {
  PricingEnginePanel,
  type ILineItem,
} from '@/components/docyrus/pricing-engine-panel'
import {
  bankersRound,
  buildLineItemRows,
  calculateTotals,
} from '@/components/docyrus/pricing-engine-panel/lib/calculations'
import {
  DataGrid,
  DataGridSkeleton,
  DataGridSkeletonGrid,
  useDataGrid,
} from '@/components/docyrus/data-grid'
import { DataGridStandardToolbar } from '@/components/docyrus/data-grid-standard-toolbar'
import { getDataGridRowActionsColumn } from '@/components/docyrus/data-grid-row-actions-column'
import {
  EditableRecordDetail,
  EditableRecordDetailField,
  type RecordDetailField,
} from '@/components/docyrus/editable-record-detail'
import { ContactActivityPanel } from '@/components/docyrus/contact-activity-panel'
import { Button } from '@/components/animate-ui/components/buttons/button'
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from '@/components/animate-ui/components/radix/tabs'
import { DealFormDialog } from '@/components/deals/deal-form-dialog'
import { PageContainer } from '@/components/layout/page-container'
import { CommentsPanel } from '@/components/shared/comments-panel'
import { FileAttachments } from '@/components/shared/file-attachments'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDealProducts } from '@/hooks/use-deal-products'
import { useDeal, useUpdateDeal } from '@/hooks/use-deals'
import { useCompanies } from '@/hooks/use-companies'
import { useContacts } from '@/hooks/use-contacts'
import { useEnumEntities } from '@/hooks/use-enums'
import { useSalesOrders } from '@/hooks/use-sales-orders'
import { useUsers } from '@/hooks/use-users'
import type { EnumOption, IField } from '@/components/docyrus/form-fields/types'
import { UI_I18N_LOCALES, type UiI18nLocale } from '@/lib/ui-i18n'

const RIGHT_PANE_TABS = new Set([
  'activity',
  'products',
  'orders',
  'comments',
  'files',
])

function makeField(
  slug: string,
  name: string,
  type: IField['type'] = 'field-text',
  extra: Partial<IField> = {},
): IField {
  return { id: slug, name, slug, type, ...extra }
}

function extractName(value: unknown): unknown {
  if (value && typeof value === 'object' && 'name' in value)
    return (value as { name: string }).name
  return value
}

function getInitials(value: string) {
  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return initials || 'DL'
}

function getDealOrganization(value: unknown) {
  if (!value || typeof value !== 'object') return null

  return value as {
    id?: string
    name?: string
    company_logo?: { signed_url?: string | null } | null
  }
}

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

function getFieldValue(value: unknown): string | number | boolean | null {
  if (value == null) return null
  if (typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: string }).id

    return id ?? null
  }
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }

  return null
}

function mapEnumEntitiesToOptions(
  items: Array<{ id: string; name: string; color?: string; icon?: string }>,
): Array<EnumOption> {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    color: item.color,
    icon: item.icon,
  }))
}

export function DealDetail() {
  const { t, i18n } = useTranslation()
  const { dealId } = useParams({ strict: false })
  const { tab } = useSearch({ from: '/deals/$dealId' })
  const navigate = useNavigate({ from: '/deals/$dealId' })
  const { data: deal, isLoading, error } = useDeal(dealId)
  const updateDeal = useUpdateDeal()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const activeTab = tab && RIGHT_PANE_TABS.has(tab) ? tab : 'activity'

  const { data: companies = [] } = useCompanies({
    columns: ['id', 'name'],
    orderBy: 'name ASC',
  })
  const { data: contacts = [] } = useContacts({
    columns: ['id', 'name'],
    orderBy: 'name ASC',
  })
  const { data: users = [] } = useUsers()
  const { data: stageEntities = [] } = useEnumEntities('stage', {
    appSlug: 'base_crm',
    dataSourceSlug: 'deal',
  })
  const { data: leadSourceEntities = [] } = useEnumEntities('lead_source', {
    appSlug: 'base_crm',
    dataSourceSlug: 'deal',
  })
  const { data: customerTypeEntities = [] } = useEnumEntities('customer_type', {
    appSlug: 'base_crm',
    dataSourceSlug: 'deal',
  })
  const { data: reasonForLostEntities = [] } = useEnumEntities(
    'reason_for_lost',
    {
      appSlug: 'base_crm',
      dataSourceSlug: 'deal',
    },
  )

  const handleTabChange = (value: string) => {
    void navigate({ search: { tab: value }, replace: true })
  }

  const orgId =
    deal?.organization && typeof deal.organization === 'object'
      ? deal.organization.id
      : undefined

  const { data: dealProducts, isLoading: productsLoading } = useDealProducts(
    dealId
      ? {
          columns: [
            'id',
            'product(id,name)',
            'category(id,name)',
            'qty',
            'unit_price',
            'discount',
            'tax_rate',
            'total',
            'gross_total',
            'net_total',
          ],
          filters: {
            rules: [{ field: 'related_deal', operator: '=', value: dealId }],
          },
          orderBy: 'created_on asc',
        }
      : undefined,
  )

  const { data: salesOrders, isLoading: ordersLoading } = useSalesOrders(
    orgId
      ? {
          columns: [
            'id',
            'organization(id,name)',
            'status',
            'sub_total',
            'tax_total',
            'grand_total',
            'created_on',
          ],
          filters: {
            rules: [{ field: 'organization', operator: '=', value: orgId }],
          },
          orderBy: 'created_on desc',
        }
      : undefined,
  )

  const fields = useMemo<Array<RecordDetailField>>(
    () => [
      {
        field: makeField('stage', t('deals.stage'), 'field-status'),
        enumOptions: mapEnumEntitiesToOptions(stageEntities),
      },
      {
        field: makeField('deal_value', t('deals.dealValue'), 'field-number'),
      },
      {
        field: makeField(
          'expected_revenue',
          t('deals.expectedRevenue'),
          'field-number',
        ),
      },
      {
        field: makeField(
          'close_probability',
          t('deals.closeProbability'),
          'field-percent',
        ),
      },
      {
        field: makeField(
          'expected_closing_date',
          t('deals.expectedClose'),
          'field-date',
        ),
      },
      {
        field: makeField(
          'follow_up_on',
          t('deals.followUpOn', { defaultValue: 'Follow Up On' }),
          'field-date',
        ),
      },
      {
        field: makeField(
          'closed_date',
          t('deals.closedDate', { defaultValue: 'Closed Date' }),
          'field-date',
        ),
      },
      {
        field: makeField(
          'customer_type',
          t('deals.customerType'),
          'field-select',
        ),
        enumOptions: mapEnumEntitiesToOptions(customerTypeEntities),
      },
      {
        field: makeField('lead_source', t('deals.leadSource'), 'field-select'),
        enumOptions: mapEnumEntitiesToOptions(leadSourceEntities),
      },
      {
        field: makeField(
          'reason_for_lost',
          t('deals.reasonForLost', { defaultValue: 'Reason for Lost' }),
          'field-select',
        ),
        enumOptions: mapEnumEntitiesToOptions(reasonForLostEntities),
      },
      {
        field: makeField(
          'country',
          t('deals.country', { defaultValue: 'Country' }),
        ),
        readOnly: true,
      },
      {
        field: makeField(
          'organization',
          t('deals.organization'),
          'field-select',
        ),
        enumOptions: companies.map((company: any) => ({
          id: company.id,
          name: company.name,
        })),
      },
      {
        field: makeField(
          'contact_person',
          t('deals.contactPerson', { defaultValue: 'Contact Person' }),
          'field-select',
        ),
        enumOptions: contacts.map((contact: any) => ({
          id: contact.id,
          name: contact.name,
        })),
      },
      {
        field: makeField('record_owner', t('deals.owner'), 'field-select'),
        enumOptions: users.map((user: any) => ({
          id: user.id,
          name:
            `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim() ||
            user.email ||
            user.name,
        })),
      },
      {
        field: makeField(
          'hot_prospect',
          t('deals.hotProspect'),
          'field-checkbox',
        ),
      },
    ],
    [
      companies,
      contacts,
      customerTypeEntities,
      leadSourceEntities,
      reasonForLostEntities,
      stageEntities,
      t,
      users,
    ],
  )

  const record = useMemo(() => {
    if (!deal) return {}

    return {
      stage: getFieldValue(deal.stage),
      deal_value: deal.deal_value ?? null,
      expected_revenue: deal.expected_revenue ?? null,
      close_probability: deal.close_probability ?? null,
      expected_closing_date: deal.expected_closing_date ?? null,
      follow_up_on: deal.follow_up_on ?? null,
      closed_date: deal.closed_date ?? null,
      customer_type: getFieldValue(deal.customer_type),
      lead_source: getFieldValue(deal.lead_source),
      reason_for_lost: getFieldValue(deal.reason_for_lost),
      country: extractName(deal.country) ?? '',
      organization: getFieldValue(deal.organization),
      contact_person: getFieldValue(deal.contact_person),
      record_owner: getFieldValue(deal.record_owner),
      hot_prospect: deal.hot_prospect ?? false,
    }
  }, [deal])

  const handleOverviewSave = async (
    _changes: Array<unknown>,
    values: Record<string, unknown>,
  ) => {
    if (!dealId) return

    const payload = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        value === '' ? undefined : value,
      ]),
    )

    await updateDeal.mutateAsync({
      dealId,
      data: payload,
    })
  }

  const locale = useMemo<UiI18nLocale | undefined>(() => {
    const language = i18n.resolvedLanguage?.split('-')[0]

    if (language && UI_I18N_LOCALES.includes(language as UiI18nLocale)) {
      return language as UiI18nLocale
    }

    return undefined
  }, [i18n.resolvedLanguage])

  const pricingDocument = useMemo(() => {
    const pricingLineItems: Array<ILineItem> = (dealProducts ?? []).map(
      (item: any, index) => ({
        id: item.id,
        position: index,
        productId: getRelationId(item.product),
        categoryId: getRelationId(item.category),
        name: getRelationName(item.product) || t('common.na'),
        category: getRelationName(item.category) || '',
        quantity: Number(item.qty ?? 0),
        unitPrice: Number(item.unit_price ?? 0),
        vatRate: Number(item.tax_rate ?? 0),
        discountPercent: Number(item.discount ?? 0),
      }),
    )

    const enableVat = pricingLineItems.some((item) => item.vatRate > 0)
    const vatRates = Array.from(
      new Set(
        pricingLineItems
          .map((item) => item.vatRate)
          .filter((rate) => Number.isFinite(rate)),
      ),
    ).sort((left, right) => left - right)

    if (vatRates.length === 0) {
      vatRates.push(0)
    }

    const config = {
      showVatColumn: enableVat,
      showDiscountColumn: pricingLineItems.some(
        (item) => item.discountPercent > 0,
      ),
      showGrossColumn: true,
      showCategoryColumn: pricingLineItems.some(
        (item) => item.category.length > 0,
      ),
      discountBeforeVat: true,
      enableVat,
      enableLineDiscount: true,
      enableGlobalDiscount: false,
      enableAdjustment: false,
      defaultVatRate: vatRates[vatRates.length - 1] ?? 0,
      vatRates,
      viewMode: 'net' as const,
    }

    const totals = calculateTotals(
      buildLineItemRows(pricingLineItems, config),
      0,
      0,
      config,
    )

    return {
      lineItems: pricingLineItems,
      globalDiscountPercent: 0,
      adjustment: bankersRound(0),
      currency: {
        code: 'USD',
        secondaryCurrencyCode: null,
        exchangeRate: 1,
      },
      config,
      description: '',
      termsAndConditions: '',
      status: 'saved' as const,
      totals,
    }
  }, [dealProducts, t])

  const onViewOrder = (order: any) => {
    if (!order?.id) return

    void navigate({
      to: '/sales-orders/$orderId',
      params: { orderId: order.id },
    })
  }

  const orderColumns = useMemo<Array<ColumnDef<any>>>(
    () => [
      getDataGridRowActionsColumn<any>({
        onView: onViewOrder,
        onEdit: onViewOrder,
      }),
      {
        accessorKey: 'id',
        header: t('salesOrders.columns.orderNumber'),
        meta: { cell: { variant: 'short-text' } },
        enableSorting: true,
        size: 140,
      },
      {
        id: 'organization',
        accessorFn: (row) =>
          typeof row.organization === 'object'
            ? (row.organization?.name ?? '')
            : (row.organization ?? ''),
        header: t('salesOrders.columns.organization'),
        meta: { cell: { variant: 'short-text' } },
        enableSorting: true,
        size: 220,
      },
      {
        id: 'status',
        accessorFn: (row) =>
          typeof row.status === 'object'
            ? (row.status?.name ?? '')
            : (row.status ?? ''),
        header: t('salesOrders.columns.status'),
        meta: { cell: { variant: 'short-text' } },
        enableSorting: true,
        size: 160,
      },
      {
        accessorKey: 'sub_total',
        header: t('salesOrders.columns.subtotal'),
        meta: { cell: { variant: 'currency' } },
        enableSorting: true,
        size: 130,
      },
      {
        accessorKey: 'tax_total',
        header: t('salesOrders.columns.tax'),
        meta: { cell: { variant: 'currency' } },
        enableSorting: true,
        size: 120,
      },
      {
        accessorKey: 'grand_total',
        header: t('salesOrders.columns.grandTotal'),
        meta: { cell: { variant: 'currency' } },
        enableSorting: true,
        size: 140,
      },
      {
        accessorKey: 'created_on',
        header: t('salesOrders.columns.created'),
        meta: { cell: { variant: 'date' } },
        enableSorting: true,
        size: 140,
      },
    ],
    [t],
  )

  const { table: ordersTable, ...ordersGridProps } = useDataGrid({
    data: salesOrders || [],
    columns: orderColumns,
    getRowId: (row: any) => row.id,
    readOnly: true,
  })

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="mb-4 h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </PageContainer>
    )
  }

  if (error || !deal) {
    return (
      <PageContainer>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              {t('common.error')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{t('deals.failedToLoad')}</p>
            <Link to="/deals">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('deals.backToPipeline')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  const stageName =
    deal.stage && typeof deal.stage === 'object' ? deal.stage.name : deal.stage
  const organization = getDealOrganization(deal.organization)
  const organizationName = organization?.name ?? ''
  const organizationLogo = organization?.company_logo?.signed_url ?? undefined
  const dealTitle =
    deal.name?.trim() ||
    t('deals.untitledDeal', { defaultValue: 'Untitled Deal' })
  const dealNumber =
    deal.autonumber_id != null && String(deal.autonumber_id).trim().length > 0
      ? `#${deal.autonumber_id}`
      : null

  return (
    <PageContainer className="flex h-full min-h-0 flex-col gap-6 overflow-hidden">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-4">
          <Link to="/deals">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('deals.backToPipeline')}
            </Button>
          </Link>
          <div className="flex items-start gap-4">
            <Avatar
              className="size-14 rounded-2xl ring-1 ring-border/60"
              size="lg"
            >
              {organizationLogo && (
                <AvatarImage
                  src={organizationLogo}
                  alt={organizationName || dealTitle}
                />
              )}
              <AvatarFallback className="rounded-2xl bg-muted text-sm font-semibold text-foreground">
                {getInitials(organizationName || dealTitle)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-2">
              {dealNumber && (
                <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground">
                  {dealNumber}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {dealTitle}
                </h1>
                {stageName && <Badge variant="secondary">{stageName}</Badge>}
                {deal.hot_prospect && (
                  <Badge variant="destructive">{t('deals.hotProspect')}</Badge>
                )}
              </div>
              {organizationName && (
                <p className="text-sm text-muted-foreground">
                  {organizationName}
                </p>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setIsEditOpen(true)}
        >
          <Pencil className="mr-2 h-3.5 w-3.5" />
          {t('common.editAll', { defaultValue: 'Edit All' })}
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col">
          <section className="flex h-full min-h-0 flex-col rounded-3xl border border-border/60 bg-background/80 p-5">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">
                {t('deals.tabs.overview')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('deals.dealDetails')}
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <EditableRecordDetail
                fields={fields}
                record={record}
                onSave={handleOverviewSave}
                disabled={updateDeal.isPending}
              >
                <div className="space-y-4">
                  {fields.map(({ field }) => (
                    <div
                      key={field.slug}
                      className="border-b border-border/60 pb-4 last:border-b-0 last:pb-0"
                    >
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        {field.name}
                      </p>
                      <EditableRecordDetailField
                        slug={field.slug}
                        showLabel={false}
                        variant="ghost"
                        className="min-h-0 px-0 py-0"
                      />
                    </div>
                  ))}
                </div>
              </EditableRecordDetail>
            </div>
          </section>
        </aside>

        <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl border border-border/60 bg-background/80 p-4 md:p-5">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="h-full min-h-0 flex-1"
          >
            <TabsList>
              <TabsTrigger value="activity">
                <Activity className="h-4 w-4" />
                {t('deals.tabs.activity')}
              </TabsTrigger>
              <TabsTrigger value="products">
                <Package className="h-4 w-4" />
                {t('deals.tabs.products')}
              </TabsTrigger>
              <TabsTrigger value="orders">
                <ShoppingCart className="h-4 w-4" />
                {t('deals.tabs.orders')}
              </TabsTrigger>
              <TabsTrigger value="comments">
                <MessageSquare className="h-4 w-4" />
                {t('deals.tabs.comments')}
              </TabsTrigger>
              <TabsTrigger value="files">
                <FileText className="h-4 w-4" />
                {t('deals.tabs.files')}
              </TabsTrigger>
            </TabsList>

            <TabsContents mode="layout" className="min-h-0 flex-1">
              <TabsContent
                value="activity"
                className="mt-4 min-h-0 overflow-y-auto pr-1"
              >
                <ContactActivityPanel
                  activities={[]}
                  contactName={dealTitle}
                  isLoading={false}
                />
              </TabsContent>

              <TabsContent
                value="products"
                className="mt-4 min-h-0 overflow-y-auto pr-1"
              >
                {productsLoading ? (
                  <Skeleton className="h-[32rem] w-full" />
                ) : (
                  <PricingEnginePanel
                    value={pricingDocument}
                    defaultValue={pricingDocument}
                    title={
                      dealNumber ? `${dealNumber} ${dealTitle}` : dealTitle
                    }
                    locale={locale}
                    readOnly
                    showActions={false}
                    showDescription={false}
                    showTerms={false}
                    showVatColumn={pricingDocument.config.showVatColumn}
                    showDiscountColumn={
                      pricingDocument.config.showDiscountColumn
                    }
                    showGrossColumn={pricingDocument.config.showGrossColumn}
                    showCategoryColumn={
                      pricingDocument.config.showCategoryColumn
                    }
                    discountBeforeVat={pricingDocument.config.discountBeforeVat}
                    enableVat={pricingDocument.config.enableVat}
                    enableLineDiscount={
                      pricingDocument.config.enableLineDiscount
                    }
                    enableGlobalDiscount={
                      pricingDocument.config.enableGlobalDiscount
                    }
                    enableAdjustment={pricingDocument.config.enableAdjustment}
                    defaultVatRate={pricingDocument.config.defaultVatRate}
                    vatRates={pricingDocument.config.vatRates}
                    defaultCurrency={pricingDocument.currency.code}
                    viewMode={pricingDocument.config.viewMode}
                    size="full"
                    variant="bordered"
                  />
                )}
              </TabsContent>

              <TabsContent
                value="orders"
                className="mt-4 min-h-0 overflow-y-auto pr-1"
              >
                {organizationName && (
                  <p className="mb-4 text-sm text-muted-foreground">
                    {t('deals.orders.relatedByOrganization', {
                      defaultValue:
                        'Showing sales orders for the same organization: {{organization}}',
                      organization: organizationName,
                    })}
                  </p>
                )}

                {ordersLoading ? (
                  <DataGridSkeleton>
                    <DataGridSkeletonGrid />
                  </DataGridSkeleton>
                ) : !salesOrders?.length ? (
                  <div className="rounded-2xl border border-dashed border-border/60 px-6 py-10 text-center">
                    <p className="font-medium">{t('deals.orders.empty')}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {organizationName
                        ? t('deals.orders.relatedByOrganizationEmpty', {
                            defaultValue:
                              'No sales orders were found for {{organization}}.',
                            organization: organizationName,
                          })
                        : t('deals.orders.relatedByOrganizationMissing', {
                            defaultValue:
                              'This deal does not have an organization linked yet.',
                          })}
                    </p>
                  </div>
                ) : (
                  <>
                    <DataGridStandardToolbar
                      table={ordersTable}
                      searchPlaceholder={t('common.search', 'Search...')}
                    />
                    <DataGrid
                      table={ordersTable}
                      {...ordersGridProps}
                      height={520}
                    />
                  </>
                )}
              </TabsContent>

              <TabsContent
                value="comments"
                className="mt-4 min-h-0 overflow-y-auto pr-1"
              >
                <CommentsPanel
                  appSlug="base_crm"
                  dataSource="deal"
                  recordId={dealId!}
                />
              </TabsContent>

              <TabsContent
                value="files"
                className="mt-4 min-h-0 overflow-y-auto pr-1"
              >
                <FileAttachments
                  appSlug="base_crm"
                  dataSource="deal"
                  recordId={dealId!}
                />
              </TabsContent>
            </TabsContents>
          </Tabs>
        </section>
      </div>

      <DealFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        deal={deal}
        mode="edit"
      />
    </PageContainer>
  )
}
