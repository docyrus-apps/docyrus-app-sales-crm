/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useMemo } from 'react'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  Briefcase,
  CircleDot,
  FileText,
  MessageSquare,
  Package,
  Percent,
  Phone,
  ShoppingCart,
  StickyNote,
  Users,
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
  type FieldChange,
  type RecordDetailField,
} from '@/components/docyrus/editable-record-detail'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/animate-ui/components/radix/dropdown-menu'
import {
  RecordDetailLayout,
  RecordKpiCard,
  type RecordDetailTab,
} from '@/components/crm/record-detail-layout'
import { RelatedContactsTable } from '@/components/crm/related-contacts-table'
import { RecordActivityTimeline } from '@/components/crm/record-activity-timeline'
import { useDialer } from '@/components/dialer/dialer-widget'
import { PageContainer } from '@/components/layout/page-container'
import { CommentsPanel } from '@/components/shared/comments-panel'
import { FileAttachments } from '@/components/shared/file-attachments'
import { useDealProducts } from '@/hooks/use-deal-products'
import { useDeal, useUpdateDeal } from '@/hooks/use-deals'
import { useCompanies } from '@/hooks/use-companies'
import { useContacts } from '@/hooks/use-contacts'
import { useEnumEntities } from '@/hooks/use-enums'
import { useRecordEvents } from '@/hooks/use-events'
import { useSalesOrders } from '@/hooks/use-sales-orders'
import { useUsers } from '@/hooks/use-users'
import type { EnumOption, IField } from '@/components/docyrus/form-fields/types'
import { UI_I18N_LOCALES, type UiI18nLocale } from '@/lib/ui-i18n'

const FIELD_SLUGS = [
  'stage',
  'deal_value',
  'expected_revenue',
  'close_probability',
  'expected_closing_date',
  'follow_up_on',
  'closed_date',
  'customer_type',
  'lead_source',
  'reason_for_lost',
  'country',
  'organization',
  'contact_person',
  'record_owner',
  'hot_prospect',
]

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
  items: Array<{
    id: string
    name: string
    color?: string | null
    icon?: string | null
  }>,
): Array<EnumOption> {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    color: item.color ?? undefined,
    icon: item.icon ?? undefined,
  }))
}

export function DealDetail() {
  const { t, i18n } = useTranslation()
  const { dealId } = useParams({ strict: false })
  const { tab } = useSearch({ from: '/deals/$dealId' })
  const navigate = useNavigate({ from: '/deals/$dealId' })
  const { data: deal, isLoading } = useDeal(dealId)
  const updateDeal = useUpdateDeal()
  const dialer = useDialer()

  const activeTab = tab || 'overview'

  const handleTabChange = (value: string) => {
    void navigate({ search: { tab: value }, replace: true })
  }

  const { data: companies = [] } = useCompanies({
    columns: ['id', 'name'],
    orderBy: 'name ASC',
  })
  const { data: allContacts = [] } = useContacts({
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

  const orgId =
    deal?.organization && typeof deal.organization === 'object'
      ? deal.organization.id
      : undefined

  const { data: orgContacts = [], isLoading: orgContactsLoading } = useContacts(
    orgId
      ? {
          columns: ['id', 'name', 'job_title', 'email', 'mobile'],
          filters: {
            rules: [{ field: 'organization', operator: '=', value: orgId }],
          },
          orderBy: 'created_on desc',
        }
      : undefined,
  )

  const { data: events = [], isLoading: eventsLoading } = useRecordEvents(
    'deal',
    dealId,
  )

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

  const detailFields = useMemo<Array<RecordDetailField>>(
    () => [
      {
        field: makeField('stage', t('deals.stage'), 'field-status'),
        enumOptions: mapEnumEntitiesToOptions(stageEntities),
      },
      { field: makeField('deal_value', t('deals.dealValue'), 'field-number') },
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
        enumOptions: allContacts.map((contact: any) => ({
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
      allContacts,
      customerTypeEntities,
      leadSourceEntities,
      reasonForLostEntities,
      stageEntities,
      t,
      users,
    ],
  )

  const flatRecord = useMemo<Record<string, unknown>>(() => {
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

  const handleInlineSave = async (
    changes: Array<FieldChange>,
    _values: Record<string, unknown>,
  ) => {
    if (!dealId || changes.length === 0) return

    const payload = Object.fromEntries(
      changes.map((change) => [
        change.fieldSlug,
        change.newValue === '' ? undefined : change.newValue,
      ]),
    )

    await updateDeal.mutateAsync({ dealId, data: payload })
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

  const noopOrderAction = () => {}

  const orderColumns = useMemo<Array<ColumnDef<any>>>(
    () => [
      getDataGridRowActionsColumn<any>({
        onView: onViewOrder,
        onEdit: onViewOrder,
        onDuplicate: noopOrderAction,
        onDelete: noopOrderAction,
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

  // Generated entity type omits `name`/`autonumber_id`, present at runtime.
  const dealRecord = deal as
    | (typeof deal & { name?: string; autonumber_id?: string | number })
    | undefined
  const stageName =
    deal?.stage && typeof deal.stage === 'object'
      ? deal.stage.name
      : deal?.stage
  const organization = getDealOrganization(deal?.organization)
  const organizationName = organization?.name ?? ''
  const organizationLogo = organization?.company_logo?.signed_url ?? undefined
  const dealTitle =
    dealRecord?.name?.trim() ||
    t('deals.untitledDeal', { defaultValue: 'Untitled Deal' })
  const dealNumber =
    dealRecord?.autonumber_id != null &&
    String(dealRecord.autonumber_id).trim().length > 0
      ? `#${dealRecord.autonumber_id}`
      : null

  const contactsWithPhone = useMemo(
    () => orgContacts.filter((c: any) => c.mobile),
    [orgContacts],
  )

  const tabs = useMemo<Array<RecordDetailTab>>(() => {
    return [
      {
        value: 'overview',
        label: t('deals.tabs.overview'),
        icon: <CircleDot className="size-3.5" />,
        content: (
          <div className="space-y-5">
            <div className="grid gap-2.5 sm:grid-cols-3">
              <RecordKpiCard
                label={t('deals.dealValue')}
                value={
                  typeof deal?.deal_value === 'number'
                    ? deal.deal_value.toLocaleString()
                    : '—'
                }
                icon={<Briefcase className="size-3.5" />}
              />
              <RecordKpiCard
                label={t('deals.stage')}
                value={stageName || '—'}
                icon={<CircleDot className="size-3.5" />}
              />
              <RecordKpiCard
                label={t('deals.closeProbability')}
                value={
                  deal?.close_probability != null
                    ? `${deal.close_probability}%`
                    : '—'
                }
                icon={<Percent className="size-3.5" />}
              />
            </div>

            <div className="rounded-xl border p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold">
                  {t('contacts.recentActivity', {
                    defaultValue: 'Recent activity',
                  })}
                </h3>
                <button
                  type="button"
                  onClick={() => handleTabChange('activity')}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  {t('common.viewAll', { defaultValue: 'View all' })}
                </button>
              </div>
              <RecordActivityTimeline
                events={events}
                isLoading={eventsLoading}
                limit={2}
              />
            </div>
          </div>
        ),
      },
      {
        value: 'activity',
        label: t('deals.tabs.activity'),
        icon: <Activity className="size-3.5" />,
        content: (
          <RecordActivityTimeline events={events} isLoading={eventsLoading} />
        ),
      },
      {
        value: 'contacts',
        label: t('deals.tabs.contacts', { defaultValue: 'Contacts' }),
        icon: <Users className="size-3.5" />,
        count: orgContacts.length,
        bare: true,
        content: (
          <RelatedContactsTable
            contacts={orgContacts as any}
            isLoading={orgContactsLoading}
            emptyLabel={t('deals.contacts.empty', {
              defaultValue: 'No contacts for this organization',
            })}
            onAddContact={() => navigate({ to: '/contacts' })}
            onOpenContact={(id) =>
              navigate({
                to: '/contacts/$contactId',
                params: { contactId: id },
                search: { tab: 'overview' },
              })
            }
            onEmail={(c) => c.email && window.open(`mailto:${c.email}`)}
            onCall={(c) => dialer.open({ name: c.name, number: c.mobile })}
            onSms={(c) => c.mobile && window.open(`sms:${c.mobile}`)}
          />
        ),
      },
      {
        value: 'products',
        label: t('deals.tabs.products'),
        icon: <Package className="size-3.5" />,
        bare: true,
        content: (
          <div className="h-full overflow-auto p-4">
            {productsLoading ? (
              <div className="h-[32rem] w-full animate-pulse rounded-xl bg-muted/40" />
            ) : (
              <PricingEnginePanel
                value={pricingDocument}
                defaultValue={pricingDocument}
                title={dealNumber ? `${dealNumber} ${dealTitle}` : dealTitle}
                locale={locale}
                readOnly
                showActions={false}
                showDescription={false}
                showTerms={false}
                showVatColumn={pricingDocument.config.showVatColumn}
                showDiscountColumn={pricingDocument.config.showDiscountColumn}
                showGrossColumn={pricingDocument.config.showGrossColumn}
                showCategoryColumn={pricingDocument.config.showCategoryColumn}
                discountBeforeVat={pricingDocument.config.discountBeforeVat}
                enableVat={pricingDocument.config.enableVat}
                enableLineDiscount={pricingDocument.config.enableLineDiscount}
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
          </div>
        ),
      },
      {
        value: 'orders',
        label: t('deals.tabs.orders'),
        icon: <ShoppingCart className="size-3.5" />,
        bare: true,
        content: (
          <div className="flex h-full min-h-0 flex-col overflow-auto p-4">
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
          </div>
        ),
      },
      {
        value: 'notes',
        label: t('deals.tabs.comments'),
        icon: <MessageSquare className="size-3.5" />,
        bare: true,
        content: (
          <div className="h-full overflow-auto p-4">
            <CommentsPanel
              appSlug="base_crm"
              dataSource="deal"
              recordId={dealId!}
            />
          </div>
        ),
      },
      {
        value: 'files',
        label: t('deals.tabs.files'),
        icon: <FileText className="size-3.5" />,
        bare: true,
        content: (
          <div className="h-full overflow-auto p-4">
            <FileAttachments
              appSlug="base_crm"
              dataSource="deal"
              recordId={dealId!}
            />
          </div>
        ),
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    t,
    deal?.deal_value,
    deal?.close_probability,
    stageName,
    events,
    eventsLoading,
    orgContacts,
    orgContactsLoading,
    productsLoading,
    pricingDocument,
    dealNumber,
    dealTitle,
    locale,
    organizationName,
    ordersLoading,
    salesOrders,
    ordersTable,
    ordersGridProps,
    dealId,
  ])

  const attributeActions = (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-[13px]"
        onClick={() => handleTabChange('notes')}
      >
        <StickyNote className="size-3.5" />
        {t('contacts.actions.note', { defaultValue: 'Note' })}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-[13px]"
        onClick={() => handleTabChange('activity')}
      >
        <Activity className="size-3.5" />
        {t('deals.tabs.activity')}
      </Button>
    </>
  )

  const dialerTrigger = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open dialer"
          className="flex size-8 shrink-0 items-center justify-center rounded-md border text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
        >
          <Phone className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          {t('companies.callContact', { defaultValue: 'Call a contact' })}
        </DropdownMenuLabel>
        {contactsWithPhone.length === 0 ? (
          <DropdownMenuItem disabled>
            {t('companies.noContactPhones', {
              defaultValue: 'No contact phone numbers',
            })}
          </DropdownMenuItem>
        ) : (
          contactsWithPhone.map((c: any) => (
            <DropdownMenuItem
              key={c.id}
              onClick={() => dialer.open({ name: c.name, number: c.mobile })}
            >
              <Phone className="size-4 text-emerald-600" />
              <span className="truncate">{c.name}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <PageContainer className="flex h-full min-h-0 flex-col overflow-hidden">
      <RecordDetailLayout
        isLoading={isLoading}
        avatar={
          <Avatar className="size-9 rounded-lg">
            {organizationLogo && (
              <AvatarImage src={organizationLogo} alt={organizationName} />
            )}
            <AvatarFallback className="rounded-lg bg-muted text-xs font-semibold">
              {getInitials(organizationName || dealTitle)}
            </AvatarFallback>
          </Avatar>
        }
        title={dealTitle}
        subtitle={
          dealNumber
            ? `${dealNumber}${organizationName ? ` · ${organizationName}` : ''}`
            : organizationName || stageName
        }
        onBack={() => navigate({ to: '/deals' })}
        detailFields={detailFields}
        fieldSlugs={FIELD_SLUGS}
        record={flatRecord}
        onInlineSave={handleInlineSave}
        editTitle={t('common.editAll', { defaultValue: 'Edit All' })}
        attributeActions={attributeActions}
        dialerTrigger={dialerTrigger}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </PageContainer>
  )
}
