/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  Pencil,
  Activity,
  Briefcase,
  Package,
  ShoppingCart,
} from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/animate-ui/components/buttons/button'
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from '@/components/animate-ui/components/radix/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDeal } from '@/hooks/use-deals'
import { useDealProducts } from '@/hooks/use-deal-products'
import { useSalesOrders } from '@/hooks/use-sales-orders'
import { DealFormDialog } from '@/components/deals/deal-form-dialog'
import { CommentsPanel } from '@/components/shared/comments-panel'
import { FileAttachments } from '@/components/shared/file-attachments'
import { ContactActivityPanel } from '@/components/docyrus/contact-activity-panel'
import {
  EditableRecordDetail,
  EditableRecordDetailField,
  type RecordDetailField,
} from '@/components/docyrus/editable-record-detail'
import type { IField } from '@/components/docyrus/form-fields/types'

function makeField(
  slug: string,
  name: string,
  type: IField['type'] = 'field-text',
): IField {
  return { id: slug, name, slug, type }
}

function extractName(value: unknown): unknown {
  if (value && typeof value === 'object' && 'name' in value)
    return (value as { name: string }).name
  return value
}

export function DealDetail() {
  const { t } = useTranslation()
  const { dealId } = useParams({ strict: false })
  const { tab } = useSearch({ from: '/deals/$dealId' })
  const navigate = useNavigate({ from: '/deals/$dealId' })
  const { data: deal, isLoading, error } = useDeal(dealId)
  const [isEditOpen, setIsEditOpen] = useState(false)

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
            'qty',
            'unit_price',
            'discount',
            'tax_rate',
            'total',
            'net_total',
          ],
          filters: {
            rules: [{ field: 'related_deal', operator: '=', value: dealId }],
          },
          orderBy: 'created_on desc',
        }
      : undefined,
  )

  const { data: salesOrders, isLoading: ordersLoading } = useSalesOrders(
    orgId
      ? {
          columns: ['id', 'status', 'sub_total', 'grand_total', 'created_on'],
          filters: {
            rules: [{ field: 'organization', operator: '=', value: orgId }],
          },
          orderBy: 'created_on desc',
        }
      : undefined,
  )

  const fields = useMemo<Array<RecordDetailField>>(
    () => [
      { field: makeField('stage', t('deals.stage')), readOnly: true },
      {
        field: makeField('deal_value', t('deals.dealValue'), 'field-number'),
        readOnly: true,
      },
      {
        field: makeField(
          'expected_revenue',
          t('deals.expectedRevenue'),
          'field-number',
        ),
        readOnly: true,
      },
      {
        field: makeField(
          'close_probability',
          t('deals.closeProbability'),
          'field-number',
        ),
        readOnly: true,
      },
      {
        field: makeField(
          'expected_closing_date',
          t('deals.expectedClose'),
          'field-date',
        ),
        readOnly: true,
      },
      {
        field: makeField('customer_type', t('deals.customerType')),
        readOnly: true,
      },
      {
        field: makeField('lead_source', t('deals.leadSource')),
        readOnly: true,
      },
      {
        field: makeField('organization', t('deals.organization')),
        readOnly: true,
      },
      {
        field: makeField(
          'contact_person',
          t('deals.contactPerson', { defaultValue: 'Contact Person' }),
        ),
        readOnly: true,
      },
      {
        field: makeField('record_owner', t('deals.owner')),
        readOnly: true,
      },
      {
        field: makeField(
          'hot_prospect',
          t('deals.hotProspect'),
          'field-checkbox',
        ),
        readOnly: true,
      },
    ],
    [t],
  )

  const record = useMemo(() => {
    if (!deal) return {}
    return {
      stage: extractName(deal.stage) ?? '',
      deal_value: deal.deal_value ?? '',
      expected_revenue: deal.expected_revenue ?? '',
      close_probability:
        deal.close_probability != null ? `${deal.close_probability}%` : '',
      expected_closing_date: deal.expected_closing_date ?? '',
      customer_type: extractName(deal.customer_type) ?? '',
      lead_source: extractName(deal.lead_source) ?? '',
      organization: extractName(deal.organization) ?? '',
      contact_person: extractName(deal.contact_person) ?? '',
      record_owner: extractName(deal.record_owner) ?? '',
      hot_prospect: deal.hot_prospect ?? false,
    }
  }, [deal])

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-8 w-64 mb-4" />
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

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/deals">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('deals.backToPipeline')}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">
              {deal.deal_value != null
                ? `$${deal.deal_value.toLocaleString()}`
                : t('deals.dealDetails')}
            </h1>
            {stageName && <Badge variant="secondary">{stageName}</Badge>}
            {deal.hot_prospect && (
              <Badge variant="destructive">{t('deals.hotProspect')}</Badge>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
          <Pencil className="mr-2 h-3.5 w-3.5" />
          {t('common.editAll', { defaultValue: 'Edit All' })}
        </Button>
      </div>

      <Tabs
        value={tab || 'details'}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="details">
            <Briefcase className="h-4 w-4" />
            {t('deals.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="h-4 w-4" />
            {t('deals.tabs.products')}
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingCart className="h-4 w-4" />
            {t('deals.tabs.orders')}
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4" />
            {t('deals.tabs.activity')}
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

        <TabsContents>
          <TabsContent value="details" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <EditableRecordDetail fields={fields} record={record} readOnly>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                    <EditableRecordDetailField slug="stage" />
                    <EditableRecordDetailField slug="deal_value" />
                    <EditableRecordDetailField slug="expected_revenue" />
                    <EditableRecordDetailField slug="close_probability" />
                    <EditableRecordDetailField slug="expected_closing_date" />
                    <EditableRecordDetailField slug="customer_type" />
                    <EditableRecordDetailField slug="lead_source" />
                    <EditableRecordDetailField slug="organization" />
                    <EditableRecordDetailField slug="contact_person" />
                    <EditableRecordDetailField slug="record_owner" />
                    <EditableRecordDetailField slug="hot_prospect" />
                  </div>
                </EditableRecordDetail>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('deals.products.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : !dealProducts?.length ? (
                  <p className="text-sm text-muted-foreground">
                    {t('deals.products.empty')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {dealProducts.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">
                            {typeof item.product === 'object'
                              ? item.product.name
                              : item.product || t('common.na')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t('deals.products.qty')}: {item.qty} &times; $
                            {item.unit_price?.toLocaleString()}
                            {item.discount ? ` (-${item.discount}%)` : ''}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            $
                            {item.net_total?.toLocaleString() ??
                              item.total?.toLocaleString() ??
                              '0'}
                          </div>
                          {item.tax_rate != null && (
                            <div className="text-sm text-muted-foreground">
                              {t('deals.products.tax')}: {item.tax_rate}%
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('deals.orders.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : !salesOrders?.length ? (
                  <p className="text-sm text-muted-foreground">
                    {t('deals.orders.empty')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {salesOrders.map((order: any) => (
                      <Link
                        key={order.id}
                        to="/sales-orders/$orderId"
                        params={{ orderId: order.id }}
                        className="block"
                      >
                        <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium">
                              {t('deals.orders.orderNumber', {
                                id: order.id,
                              })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {typeof order.status === 'object'
                                ? order.status.name
                                : order.status || t('common.na')}
                              {order.created_on &&
                                ` · ${new Date(order.created_on).toLocaleDateString()}`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              ${order.grand_total?.toLocaleString() || '0'}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <ContactActivityPanel
              activities={[]}
              contactName={
                deal.deal_value != null
                  ? `$${deal.deal_value.toLocaleString()}`
                  : ''
              }
              isLoading={false}
            />
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            <CommentsPanel
              appSlug="base_crm"
              dataSource="deals"
              recordId={dealId!}
            />
          </TabsContent>

          <TabsContent value="files" className="mt-4">
            <FileAttachments
              appSlug="base_crm"
              dataSource="deals"
              recordId={dealId!}
            />
          </TabsContent>
        </TabsContents>
      </Tabs>

      <DealFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        deal={deal}
        mode="edit"
      />
    </PageContainer>
  )
}
