import { useMemo, useState } from 'react'

import { type ColumnDef } from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'

import type {
  FieldChange,
  RecordDetailField
} from '@/components/docyrus/editable-record-detail'

import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  Briefcase,
  CircleDot,
  FileText,
  ListTodo,
  MessageSquare,
  Package,
  Percent,
  Phone,
  ShoppingCart,
  StickyNote,
  Users
} from 'lucide-react'

import {
  DataGrid,
  DataGridSkeleton,
  DataGridSkeletonGrid,
  useDataGrid
} from '@/components/docyrus/data-grid'
import { DataGridStandardToolbar } from '@/components/docyrus/data-grid-standard-toolbar'
import { getDataGridRowActionsColumn } from '@/components/docyrus/data-grid-row-actions-column'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  RecordDetailLayout,
  type RecordDetailTab,
  RecordKpiCard
} from '@/components/crm/record-detail-layout'
import { ContactAddDialog } from '@/components/crm/contact-add-dialog'
import { RelatedContactsTable } from '@/components/crm/related-contacts-table'
import { DealProductsPanel } from '@/components/deals/deal-products-panel'
import { RelatedQuotesTable } from '@/components/crm/related-quotes-table'
import { RecordActivityPanel } from '@/components/docyrus/record-activity-panel'
import { RecordTasksPanel } from '@/components/crm/record-tasks-panel'
import { RecordNotesPanel } from '@/components/crm/record-notes-panel'
import { useDialer } from '@/components/dialer/dialer-widget'
import { useWebphone } from '@/components/webphone/webphone-context'
import { PageContainer } from '@/components/layout/page-container'
import { CommentsPanel } from '@/components/shared/comments-panel'
import { FileAttachments } from '@/components/shared/file-attachments'
import { useBaseCountryCollection } from '@/collections'
import { useDeal, useUpdateDeal } from '@/hooks/use-deals'
import { useCompanies } from '@/hooks/use-companies'
import { useContacts, useUpdateContact } from '@/hooks/use-contacts'
import { useEnumEntities } from '@/hooks/use-enums'
import { useRecordActivities } from '@/hooks/use-record-activities'
import { useSalesOrders } from '@/hooks/use-sales-orders'
import { useUsers } from '@/hooks/use-users'

import type { EnumOption, IField } from '@/components/docyrus/form-fields/types'

import { useSetDetailBreadcrumbTitle } from '@/lib/detail-breadcrumb'
import { mergeCurrentEnumOption } from '@/lib/enum-options'

const FIELD_SLUGS = [
  'name',
  'stage',
  'deal_value',
  'expected_revenue',
  'close_probability',
  'expected_closing_date',
  'follow_up_on',
  'closed_date',
  'customer_type',
  'deal_type',
  'lead_source',
  'reason_for_lost',
  'country',
  'organization',
  'contact_person',
  'record_owner',
  'hot_prospect'
]

function makeField(
  slug: string,
  name: string,
  type: IField['type'] = 'field-text',
  extra: Partial<IField> = {}
): IField {
  return {
    id: slug,
    name,
    slug,
    type,
    ...extra
  }
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
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')

  return initials || 'DL'
}

function getDealOrganization(value: unknown) {
  if (!value || typeof value !== 'object') return null

  return value as {
    id?: string;
    name?: string;
    company_logo?: { signed_url?: string | null } | null;
  }
}

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

function getFieldValue(value: unknown): string | number | boolean | null {
  if (value == null) return null
  if (typeof value === 'object' && 'id' in value) {
    const { id } = value as { id?: string }

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
    id: string;
    name: string;
    color?: string | null;
    icon?: string | null;
  }>
): Array<EnumOption> {
  return items.map(item => ({
    id: item.id,
    name: item.name,
    color: item.color ?? undefined,
    icon: item.icon ?? undefined
  }))
}

function getMultiRelationIds(value: unknown): Array<string> {
  if (!Array.isArray(value)) return []

  return Array.from(
    new Set(
      value.flatMap((item) => {
        if (typeof item === 'string') return item ? [item] : []
        if (item && typeof item === 'object' && 'id' in item) {
          const { id } = item as { id?: string | null }

          return id ? [id] : []
        }

        return []
      })
    )
  )
}

export function DealDetail() {
  const { t } = useTranslation()
  const { dealId } = useParams({ strict: false })
  const { tab } = useSearch({ from: '/deals/$dealId' })
  const navigate = useNavigate({ from: '/deals/$dealId' })
  const { data: deal, isLoading } = useDeal(dealId)
  const updateDeal = useUpdateDeal()
  const updateContact = useUpdateContact()
  const dialer = useDialer()
  const webphone = useWebphone()
  const countriesCollection = useBaseCountryCollection()

  const activeTab = tab || 'overview'

  const handleTabChange = (value: string) => {
    void navigate({ search: { tab: value }, replace: true })
  }

  const { data: companies = [] } = useCompanies({
    columns: ['id', 'name'],
    orderBy: 'name ASC'
  })
  const { data: allContacts = [] } = useContacts({
    columns: ['id', 'name'],
    orderBy: 'name ASC'
  })
  const { data: users = [] } = useUsers()
  const { data: stageEntities = [] } = useEnumEntities('stage', {
    appSlug: 'base_crm',
    dataSourceSlug: 'deal'
  })
  const { data: leadSourceEntities = [] } = useEnumEntities('lead_source', {
    appSlug: 'base_crm',
    dataSourceSlug: 'deal'
  })
  const { data: customerTypeEntities = [] } = useEnumEntities('customer_type', {
    appSlug: 'base_crm',
    dataSourceSlug: 'deal'
  })
  const { data: reasonForLostEntities = [] } = useEnumEntities(
    'reason_for_lost',
    {
      appSlug: 'base_crm',
      dataSourceSlug: 'deal'
    }
  )
  const { data: dealTypeEntities = [] } = useEnumEntities('deal_type', {
    appSlug: 'base_crm',
    dataSourceSlug: 'deal'
  })
  const { data: countries = [] } = useQuery({
    queryKey: ['base-country-options'],
    queryFn: () => countriesCollection.list({
        columns: ['id', 'name'],
        orderBy: 'name ASC',
        limit: 300
      })
  })
  const countryOptions = useMemo<Array<EnumOption>>(() => {
    const options = countries.map(country => ({
      id: country.id ?? '',
      name: country.name
    }))
    const currentId = getFieldValue(deal?.country)
    const currentName = extractName(deal?.country)

    if (
      typeof currentId === 'string' &&
      currentId &&
      currentName &&
      !options.some(option => option.id === currentId)
    ) {
      options.unshift({ id: currentId, name: String(currentName) })
    }

    return options.filter(option => option.id)
  }, [countries, deal?.country])

  const [addContactOpen, setAddContactOpen] = useState(false)

  const orgId =
    deal?.organization && typeof deal.organization === 'object'
      ? deal.organization.id
      : undefined

  const { data: orgContacts = [], isLoading: orgContactsLoading } = useContacts(
    orgId
      ? {
          columns: [
'id',
'name',
'job_title',
'email',
'mobile'
],
          filters: {
            rules: [{ field: 'organization', operator: '=', value: orgId }]
          },
          orderBy: 'created_on desc'
        }
      : undefined
  )

  const { data: activities = [], isLoading: activitiesLoading } =
    useRecordActivities('base_crm', 'deal', dealId)

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
            'created_on'
          ],
          filters: {
            rules: [{ field: 'organization', operator: '=', value: orgId }]
          },
          orderBy: 'created_on desc'
        }
      : undefined
  )

  const { data: dealQuotes = [], isLoading: dealQuotesLoading } =
    useSalesOrders(
      dealId
        ? {
            columns: [
'id',
'status',
'grand_total',
'created_on'
],
            filters: {
              rules: [{ field: 'deal', operator: '=', value: dealId }]
            },
            orderBy: 'created_on DESC'
          }
        : undefined
    )

  const detailFields = useMemo<Array<RecordDetailField>>(
    () => [
      {
        field: makeField(
          'name',
          t('deals.dealName', { defaultValue: 'Deal Name' }),
          'field-text'
        )
      },
      {
        field: makeField('stage', t('deals.stage'), 'field-status'),
        enumOptions: mergeCurrentEnumOption(
          mapEnumEntitiesToOptions(stageEntities),
          deal?.stage
        )
      },
      { field: makeField('deal_value', t('deals.dealValue'), 'field-number') },
      {
        field: makeField(
          'expected_revenue',
          t('deals.expectedRevenue'),
          'field-number'
        )
      },
      {
        field: makeField(
          'close_probability',
          t('deals.closeProbability'),
          'field-percent'
        )
      },
      {
        field: makeField(
          'expected_closing_date',
          t('deals.expectedClose'),
          'field-date'
        )
      },
      {
        field: makeField(
          'follow_up_on',
          t('deals.followUpOn', { defaultValue: 'Follow Up On' }),
          'field-date'
        )
      },
      {
        field: makeField(
          'closed_date',
          t('deals.closedDate', { defaultValue: 'Closed Date' }),
          'field-date'
        )
      },
      {
        field: makeField(
          'customer_type',
          t('deals.customerType'),
          'field-select'
        ),
        enumOptions: mergeCurrentEnumOption(
          mapEnumEntitiesToOptions(customerTypeEntities),
          deal?.customer_type
        )
      },
      {
        field: makeField(
          'deal_type',
          t('deals.dealType', { defaultValue: 'Deal Type' }),
          'field-select'
        ),
        enumOptions: mergeCurrentEnumOption(
          mapEnumEntitiesToOptions(dealTypeEntities),
          deal?.deal_type
        )
      },
      {
        field: makeField('lead_source', t('deals.leadSource'), 'field-select'),
        enumOptions: mergeCurrentEnumOption(
          mapEnumEntitiesToOptions(leadSourceEntities),
          deal?.lead_source
        )
      },
      {
        field: makeField(
          'reason_for_lost',
          t('deals.reasonForLost', { defaultValue: 'Reason for Lost' }),
          'field-select'
        ),
        enumOptions: mergeCurrentEnumOption(
          mapEnumEntitiesToOptions(reasonForLostEntities),
          deal?.reason_for_lost
        )
      },
      {
        field: makeField(
          'country',
          t('deals.country', { defaultValue: 'Country' }),
          'field-select'
        ),
        enumOptions: countryOptions
      },
      {
        field: makeField(
          'organization',
          t('deals.organization'),
          'field-select'
        ),
        enumOptions: mergeCurrentEnumOption(
          companies.map((company: any) => ({
            id: company.id,
            name: company.name
          })),
          deal?.organization
        )
      },
      {
        field: makeField(
          'contact_person',
          t('deals.contactPerson', { defaultValue: 'Contact Person' }),
          'field-select'
        ),
        enumOptions: mergeCurrentEnumOption(
          allContacts.map((contact: any) => ({
            id: contact.id,
            name: contact.name
          })),
          deal?.contact_person
        )
      },
      {
        field: makeField('record_owner', t('deals.owner'), 'field-select'),
        enumOptions: mergeCurrentEnumOption(
          users.map((user: any) => ({
            id: user.id,
            name:
              `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim() ||
              user.email ||
              user.name
          })),
          deal?.record_owner
        )
      },
      {
        field: makeField(
          'hot_prospect',
          t('deals.hotProspect'),
          'field-checkbox'
        )
      }
    ],
    [
      companies,
      allContacts,
      customerTypeEntities,
      dealTypeEntities,
      leadSourceEntities,
      reasonForLostEntities,
      stageEntities,
      countryOptions,
      t,
      users,
      deal
    ]
  )

  const flatRecord = useMemo<Record<string, unknown>>(() => {
    if (!deal) return {}

    return {
      name: deal.name ?? '',
      stage: getFieldValue(deal.stage),
      deal_value: deal.deal_value ?? null,
      expected_revenue: deal.expected_revenue ?? null,
      close_probability: deal.close_probability ?? null,
      expected_closing_date: deal.expected_closing_date ?? null,
      follow_up_on: deal.follow_up_on ?? null,
      closed_date: deal.closed_date ?? null,
      customer_type: getFieldValue(deal.customer_type),
      deal_type: getFieldValue(deal.deal_type),
      lead_source: getFieldValue(deal.lead_source),
      reason_for_lost: getFieldValue(deal.reason_for_lost),
      country: getFieldValue(deal.country) ?? '',
      organization: getFieldValue(deal.organization),
      contact_person: getFieldValue(deal.contact_person),
      record_owner: getFieldValue(deal.record_owner),
      hot_prospect: deal.hot_prospect ?? false
    }
  }, [deal])

  const handleInlineSave = async (
    changes: Array<FieldChange>,
    _values: Record<string, unknown>
  ) => {
    if (!dealId || changes.length === 0) return

    const payload = Object.fromEntries(
      changes.map(change => [change.fieldSlug, change.newValue === '' ? undefined : change.newValue])
    )

    await updateDeal.mutateAsync({ dealId, data: payload })
  }

  const onViewOrder = (order: any) => {
    if (!order?.id) return

    void navigate({
      to: '/sales-orders/$orderId',
      params: { orderId: order.id }
    })
  }

  const noopOrderAction = () => {}

  const orderColumns = useMemo<Array<ColumnDef<any>>>(
    () => [
      getDataGridRowActionsColumn<any>({
        onView: onViewOrder,
        onEdit: onViewOrder,
        onDuplicate: noopOrderAction,
        onDelete: noopOrderAction
      }),
      {
        accessorKey: 'id',
        header: t('salesOrders.columns.orderNumber'),
        meta: { cell: { variant: 'short-text' } },
        enableSorting: true,
        size: 140
      },
      {
        id: 'organization',
        accessorFn: row => typeof row.organization === 'object'
            ? (row.organization?.name ?? '')
            : (row.organization ?? ''),
        header: t('salesOrders.columns.organization'),
        meta: { cell: { variant: 'short-text' } },
        enableSorting: true,
        size: 220
      },
      {
        id: 'status',
        accessorFn: row => typeof row.status === 'object'
            ? (row.status?.name ?? '')
            : (row.status ?? ''),
        header: t('salesOrders.columns.status'),
        meta: { cell: { variant: 'short-text' } },
        enableSorting: true,
        size: 160
      },
      {
        accessorKey: 'sub_total',
        header: t('salesOrders.columns.subtotal'),
        meta: { cell: { variant: 'currency' } },
        enableSorting: true,
        size: 130
      },
      {
        accessorKey: 'tax_total',
        header: t('salesOrders.columns.tax'),
        meta: { cell: { variant: 'currency' } },
        enableSorting: true,
        size: 120
      },
      {
        accessorKey: 'grand_total',
        header: t('salesOrders.columns.grandTotal'),
        meta: { cell: { variant: 'currency' } },
        enableSorting: true,
        size: 140
      },
      {
        accessorKey: 'created_on',
        header: t('salesOrders.columns.created'),
        meta: { cell: { variant: 'date' } },
        enableSorting: true,
        size: 140
      }
    ],
    [t]
  )

  const { table: ordersTable, ...ordersGridProps } = useDataGrid({
    data: salesOrders || [],
    columns: orderColumns,
    getRowId: (row: any) => row.id,
    readOnly: true
  })

  // Generated entity type omits `name`/`autonumber_id`, present at runtime.
  const dealRecord = deal
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
  const dealCountry =
    deal?.country && typeof deal.country === 'object'
      ? (deal.country as { currency_symbol?: string | null })
      : null
  const dealCurrencySymbol = dealCountry?.currency_symbol || '$'
  const selectedProductCount = getMultiRelationIds(
    deal?.deals_products_tags
  ).length

  useSetDetailBreadcrumbTitle(
    dealRecord ? (dealNumber ? `${dealNumber} ${dealTitle}` : dealTitle) : null
  )

  const contactsWithPhone = useMemo(
    () => orgContacts.filter((c: any) => c.mobile),
    [orgContacts]
  )

  const unlinkContact = async (contact: { id?: string }) => {
    if (!contact.id) return

    await updateContact.mutateAsync({
      contactId: contact.id,
      data: { organization: null }
    })
  }

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
                icon={<Briefcase className="size-3.5" />} />
              <RecordKpiCard
                label={t('deals.stage')}
                value={stageName || '—'}
                icon={<CircleDot className="size-3.5" />} />
              <RecordKpiCard
                label={t('deals.closeProbability')}
                value={
                  deal?.close_probability != null
                    ? `${deal.close_probability}%`
                    : '—'
                }
                icon={<Percent className="size-3.5" />} />
            </div>

            <div className="rounded-xl border p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold">
                  {t('contacts.recentActivity', {
                    defaultValue: 'Recent activity'
                  })}
                </h3>
                <button
                  type="button"
                  onClick={() => handleTabChange('activity')}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground">
                  {t('common.viewAll', { defaultValue: 'View all' })}
                </button>
              </div>
              <RecordActivityPanel
                activities={activities.slice(0, 2)}
                isLoading={activitiesLoading} />
            </div>
          </div>
        )
      },
      {
        value: 'activity',
        label: t('deals.tabs.activity'),
        icon: <Activity className="size-3.5" />,
        content: (
          <RecordActivityPanel
            activities={activities}
            isLoading={activitiesLoading}
            filterable />
        )
      },
      {
        value: 'contacts',
        label: t('deals.tabs.contacts', { defaultValue: 'Contacts' }),
        icon: <Users className="size-3.5" />,
        count: orgContacts.length,
        bare: true,
        content: (
          <RelatedContactsTable
            contacts={orgContacts}
            isLoading={orgContactsLoading}
            emptyLabel={t('deals.contacts.empty', {
              defaultValue: 'No contacts for this organization'
            })}
            onAddContact={() => setAddContactOpen(true)}
            onOpenContact={id => navigate({
                to: '/contacts/$contactId',
                params: { contactId: id },
                search: { tab: 'overview' }
              })}
            onEmail={c => c.email && window.open(`mailto:${c.email}`)}
            onRemoveContact={unlinkContact}
            onCall={c => webphone.enabled
                ? dialer.open({
                    recordLabel: c.name,
                    targets: [
                      {
                        label: c.name ?? c.mobile ?? '',
                        sublabel: c.job_title || undefined,
                        number: c.mobile,
                        contactId: c.id
                      }
                    ]
                  })
                : c.mobile && window.open(`tel:${c.mobile}`)}
            onSms={c => c.mobile && window.open(`sms:${c.mobile}`)} />
        )
      },
      {
        value: 'products',
        label: t('deals.tabs.products'),
        icon: <Package className="size-3.5" />,
        count: selectedProductCount,
        bare: true,
        content: (
          <DealProductsPanel
            dealId={dealId}
            selectedProducts={deal?.deals_products_tags}
            currencySymbol={dealCurrencySymbol} />
        )
      },
      {
        value: 'quotes',
        label: t('quotes.tabLabel', { defaultValue: 'Quotes' }),
        icon: <FileText className="size-3.5" />,
        count: dealQuotes.length,
        bare: true,
        content: (
          <RelatedQuotesTable
            quotes={dealQuotes}
            isLoading={dealQuotesLoading}
            onOpenQuote={id => navigate({ to: '/quotes/$quoteId', params: { quoteId: id } })}
            onNewQuote={() => navigate({
                to: '/quotes/new',
                search: {
                  deal: dealId,
                  organization: orgId,
                  organizationName
                }
              })} />
        )
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
                  organization: organizationName
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
                        organization: organizationName
                      })
                    : t('deals.orders.relatedByOrganizationMissing', {
                        defaultValue:
                          'This deal does not have an organization linked yet.'
                      })}
                </p>
              </div>
            ) : (
              <>
                <DataGridStandardToolbar
                  table={ordersTable}
                  searchPlaceholder={t('common.search', 'Search...')} />
                <DataGrid
                  table={ordersTable}
                  {...ordersGridProps}
                  height={520} />
              </>
            )}
          </div>
        )
      },
      {
        value: 'comments',
        label: t('deals.tabs.comments'),
        icon: <MessageSquare className="size-3.5" />,
        bare: true,
        content: (
          <div className="h-full overflow-auto p-4">
            <CommentsPanel
              appSlug="base_crm"
              dataSource="deal"
              recordId={dealId!} />
          </div>
        )
      },
      {
        value: 'notes',
        label: t('deals.tabs.notes', { defaultValue: 'Notes' }),
        icon: <StickyNote className="size-3.5" />,
        bare: true,
        content: (
          <RecordNotesPanel
            appSlug="base_crm"
            dataSource="deal"
            recordId={dealId}
            recordLabel={dealTitle} />
        )
      },
      {
        value: 'tasks',
        label: t('deals.tabs.tasks', { defaultValue: 'Tasks' }),
        icon: <ListTodo className="size-3.5" />,
        bare: true,
        content: <RecordTasksPanel parentField="deal" parentId={dealId} />
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
              recordId={dealId!} />
          </div>
        )
      }
    ]
  }, [
    t,
    deal?.deal_value,
    deal?.close_probability,
    stageName,
    activities,
    activitiesLoading,
    orgContacts,
    orgContactsLoading,
    dealTitle,
    deal?.deals_products_tags,
    dealCurrencySymbol,
    selectedProductCount,
    organizationName,
    orgId,
    ordersLoading,
    salesOrders,
    ordersTable,
    ordersGridProps,
    dealQuotes,
    dealQuotesLoading,
    dealId,
    unlinkContact
  ])

  const attributeActions = (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-[13px]"
        onClick={() => handleTabChange('notes')}>
        <StickyNote className="size-3.5" />
        {t('contacts.actions.note', { defaultValue: 'Note' })}
      </Button>
    </>
  )

  /*
   * Open the webphone call composer with the deal's related contacts (the deal
   * itself has no number); the composer shows a picker / "no number" warning.
   */
  const openCallComposer = () => dialer.open({
      recordLabel: dealTitle,
      targets: contactsWithPhone.map((c: any) => ({
        label: c.name,
        sublabel: c.job_title || undefined,
        number: c.mobile,
        contactId: c.id
      }))
    })

  const dialerTrigger = webphone.enabled ? (
    <button
      type="button"
      onClick={openCallComposer}
      aria-label={t('common.openDialer')}
      className="flex size-8 shrink-0 items-center justify-center rounded-md border text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30">
      <Phone className="size-4" />
    </button>
  ) : undefined

  return (
    <PageContainer className="flex h-full min-h-0 flex-col overflow-hidden pt-0 pb-0">
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
        onTabChange={handleTabChange} />
      <ContactAddDialog
        open={addContactOpen}
        onOpenChange={setAddContactOpen}
        organizationId={orgId}
        existingContactIds={orgContacts.map(contact => contact.id)} />
    </PageContainer>
  )
}
