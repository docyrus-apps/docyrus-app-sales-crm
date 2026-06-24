import { useMemo, useState } from 'react'

import {
  type EnumOption,
  type IField
} from '@/components/docyrus/form-fields/types'

import type { RecordDetailTab } from '@/components/crm/record-detail-layout'

import { useNavigate, useParams } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { FileText, Mail, MessageSquare, Package } from 'lucide-react'

import {
  RecordDetailLayout,
  RecordTabPlaceholder
} from '@/components/crm/record-detail-layout'

import {
  type FieldChange,
  type RecordDetailField
} from '@/components/docyrus/editable-record-detail'

import { QuoteLineItems } from '@/components/quotes/quote-line-items'
import { QuoteEmailDialog } from '@/components/quotes/quote-email-dialog'
import { CommentsPanel } from '@/components/shared/comments-panel'
import { FileAttachments } from '@/components/shared/file-attachments'
import { PageContainer } from '@/components/layout/page-container'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useSalesOrder, useUpdateSalesOrder } from '@/hooks/use-sales-orders'
import { useCompanies } from '@/hooks/use-companies'
import { useEnumEntities } from '@/hooks/use-enums'
import { useSetDetailBreadcrumbTitle } from '@/lib/detail-breadcrumb'

const FIELD_SLUGS = [
  'organization',
  'status',
  'deal',
  'sub_total',
  'tax_total',
  'grand_total'
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

function getInitials(value: string) {
  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')

  return initials || 'TK'
}

function getRelationName(
  value?: { name?: string } | string | null
): string | undefined {
  if (!value) return undefined
  if (typeof value === 'object') return value.name

  return value
}

function getFieldValue(value: unknown): string | number | boolean | null {
  if (value == null) return null
  if (typeof value === 'object' && 'id' in value) {
    return (value as { id?: string }).id ?? null
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

// @docyrus: [[features#Quotes (Teklif)]]
export function QuoteDetail() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { quoteId } = useParams({ strict: false })
  const id = quoteId ?? ''

  const { data: order, isLoading } = useSalesOrder(quoteId)
  const updateOrder = useUpdateSalesOrder()
  const { data: companies = [] } = useCompanies({ columns: ['id', 'name'] })
  const { data: statusEntities = [] } = useEnumEntities('status', {
    appSlug: 'base_crm',
    dataSourceSlug: 'sales_order'
  })

  const [activeTab, setActiveTab] = useState('overview')
  const [mailOpen, setMailOpen] = useState(false)

  const customerName = getRelationName(order?.organization)
  const dealName = getRelationName(order?.deal)
  const storedDocTitle = useMemo(() => {
    if (typeof window === 'undefined' || !id) return ''
    try {
      const raw = window.localStorage.getItem(`quote-doc:${id}`)

      return raw ? String(JSON.parse(raw).docTitle ?? '') : ''
    } catch {
      return ''
    }
  }, [id])
  const quoteTitle =
    storedDocTitle ||
    customerName ||
    t('quotes.untitledQuote', { defaultValue: 'Teklif' })

  useSetDetailBreadcrumbTitle(order ? quoteTitle : null)

  const detailFields = useMemo<Array<RecordDetailField>>(
    () => [
      {
        field: makeField(
          'organization',
          t('salesOrders.organization', { defaultValue: 'Customer' }),
          'field-select'
        ),
        enumOptions: companies.map((company: any) => ({
          id: company.id,
          name: company.name
        })),
        required: true
      },
      {
        field: makeField(
          'status',
          t('salesOrders.status', { defaultValue: 'Status' }),
          statusEntities.length > 0 ? 'field-status' : 'field-text'
        ),
        enumOptions: mapEnumEntitiesToOptions(statusEntities),
        readOnly: statusEntities.length === 0
      },
      {
        field: makeField(
          'deal',
          t('deals.title', { defaultValue: 'Deal' }),
          'field-text'
        ),
        readOnly: true
      },
      {
        field: makeField(
          'sub_total',
          t('salesOrders.subtotal', { defaultValue: 'Subtotal' }),
          'field-number'
        ),
        readOnly: true
      },
      {
        field: makeField(
          'tax_total',
          t('salesOrders.taxTotal', { defaultValue: 'Tax' }),
          'field-number'
        ),
        readOnly: true
      },
      {
        field: makeField(
          'grand_total',
          t('salesOrders.grandTotal', { defaultValue: 'Grand Total' }),
          'field-number'
        ),
        readOnly: true
      }
    ],
    [companies, statusEntities, t]
  )

  const flatRecord = useMemo<Record<string, unknown>>(() => {
    if (!order) return {}

    return {
      organization: getFieldValue(order.organization),
      status: getFieldValue(order.status),
      deal: dealName ?? '',
      sub_total: order.sub_total ?? null,
      tax_total: order.tax_total ?? null,
      grand_total: order.grand_total ?? null
    }
  }, [order, dealName])

  const handleInlineSave = async (
    changes: Array<FieldChange>,
    _values: Record<string, unknown>
  ) => {
    if (!quoteId || changes.length === 0) return

    const payload = Object.fromEntries(
      changes.map(change => [change.fieldSlug, change.newValue === '' ? undefined : change.newValue])
    )

    await updateOrder.mutateAsync({ orderId: quoteId, data: payload })
  }

  const goBuild = () => navigate({ to: '/quotes/$quoteId/build', params: { quoteId: id } })

  const attributeActions = (
    <div className="flex w-full items-center justify-between gap-2">
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-[13px] font-medium"
        title={t('quotes.printPreview', { defaultValue: 'Print/Preview' })}
        onClick={goBuild}>
        {t('quotes.printPreview', { defaultValue: 'Print/Preview' })}
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-7"
        title={t('quotes.sendMail', { defaultValue: 'Send mail' })}
        onClick={() => setMailOpen(true)}>
        <Mail className="size-3.5" />
      </Button>
    </div>
  )

  const tabs = useMemo<Array<RecordDetailTab>>(
    () => [
      {
        value: 'overview',
        label: t('deals.tabs.overview', { defaultValue: 'Overview' }),
        icon: <FileText className="size-3.5" />,
        content: (
          <div className="space-y-4 p-1">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                {
                  label: t('salesOrders.organization', {
                    defaultValue: 'Customer'
                  }),
                  value: customerName ?? t('common.na', { defaultValue: '—' })
                },
                {
                  label: t('salesOrders.grandTotal', {
                    defaultValue: 'Grand Total'
                  }),
                  value:
                    typeof order?.grand_total === 'number'
                      ? order.grand_total.toLocaleString()
                      : '—'
                },
                {
                  label: t('salesOrders.status', { defaultValue: 'Status' }),
                  value:
                    getRelationName(order?.status) ??
                    t('common.na', { defaultValue: '—' })
                }
              ].map(kpi => (
                <div key={kpi.label} className="rounded-xl border p-3">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
                    {kpi.label}
                  </div>
                  <div className="mt-1 truncate text-sm font-semibold">
                    {kpi.value}
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setActiveTab('line-items')}>
              <Package className="size-4" />
              {t('quotes.editLineItems', { defaultValue: 'Edit line items' })}
            </Button>
          </div>
        )
      },
      {
        value: 'line-items',
        label: t('salesOrders.lineItems', { defaultValue: 'Line Items' }),
        icon: <Package className="size-3.5" />,
        bare: true,
        content: (
          <div className="h-full overflow-auto p-4">
            {quoteId ? (
              <QuoteLineItems quoteId={quoteId} />
            ) : (
              <RecordTabPlaceholder
                icon={<Package className="size-5" />}
                title={t('common.na', { defaultValue: '—' })} />
            )}
          </div>
        )
      },
      {
        value: 'comments',
        label: t('deals.tabs.comments', { defaultValue: 'Comments' }),
        icon: <MessageSquare className="size-3.5" />,
        bare: true,
        content: (
          <div className="h-full overflow-auto p-4">
            <CommentsPanel
              appSlug="base_crm"
              dataSource="sales_order"
              recordId={id} />
          </div>
        )
      },
      {
        value: 'files',
        label: t('deals.tabs.files', { defaultValue: 'Files' }),
        icon: <FileText className="size-3.5" />,
        bare: true,
        content: (
          <div className="h-full overflow-auto p-4">
            <FileAttachments
              appSlug="base_crm"
              dataSource="sales_order"
              recordId={id} />
          </div>
        )
      }
    ],
    [
customerName,
id,
order,
quoteId,
t
]
  )

  return (
    <PageContainer className="flex h-full min-h-0 flex-col overflow-hidden pt-0 pb-0">
      <RecordDetailLayout
        isLoading={isLoading}
        avatar={
          <Avatar className="size-9 rounded-lg">
            <AvatarFallback className="rounded-lg bg-muted text-xs font-semibold">
              {getInitials(customerName || quoteTitle)}
            </AvatarFallback>
          </Avatar>
        }
        title={quoteTitle}
        subtitle={customerName || dealName || undefined}
        onBack={() => navigate({ to: '/sales-orders' })}
        detailFields={detailFields}
        fieldSlugs={FIELD_SLUGS}
        record={flatRecord}
        onInlineSave={handleInlineSave}
        editTitle={t('common.editAll', { defaultValue: 'Edit All' })}
        showAttributeEditAllButton={false}
        attributeActions={attributeActions}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab} />
      <QuoteEmailDialog
        open={mailOpen}
        onOpenChange={setMailOpen}
        to={(order?.organization as any)?.email ?? ''}
        subject={quoteTitle} />
    </PageContainer>
  )
}
