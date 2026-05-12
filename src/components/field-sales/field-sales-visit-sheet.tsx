import { useMemo, useState } from 'react'
import {
  Building2,
  ClipboardList,
  Clock3,
  ContactRound,
  DollarSign,
  Mail,
  MapPin,
  Phone,
  ShoppingCart,
} from 'lucide-react'
import { useCompany, useCompanies } from '@/hooks/use-companies'
import { useContacts } from '@/hooks/use-contacts'
import { useDeals } from '@/hooks/use-deals'
import { useLeads } from '@/hooks/use-leads'
import { useSalesOrders } from '@/hooks/use-sales-orders'
import { FieldSalesQuickOrderDialog } from '@/components/field-sales/field-sales-quick-order-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getStatusMeta } from '@/lib/field-sales'

export interface ActiveFieldSalesVisit {
  source: 'plan' | 'company'
  organizationId: string
  organizationName: string
  planId?: string
  startedAtMs: number
  checkInTimeIso: string
  checkInLocation?: Record<string, unknown> | null
  note?: string
}

interface FieldSalesVisitSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  visit: ActiveFieldSalesVisit | null
  elapsedLabel: string
  onStartOrder: () => void
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="px-4 py-3">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </div>
        <div className="mt-2 text-lg font-semibold">{value}</div>
      </CardContent>
    </Card>
  )
}

export function FieldSalesVisitSheet({
  open,
  onOpenChange,
  visit,
  elapsedLabel,
  onStartOrder,
}: FieldSalesVisitSheetProps) {
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const { data: company } = useCompany(visit?.organizationId)
  const { data: companies = [] } = useCompanies({
    columns: ['id', 'name', 'phone', 'email', 'address', 'website', 'status'],
    limit: 300,
    orderBy: 'name ASC',
  })
  const organization =
    company ||
    companies.find((item: any) => item.id === visit?.organizationId) ||
    null

  const { data: contacts = [] } = useContacts(
    visit?.organizationId
      ? {
          columns: ['id', 'name', 'job_title', 'email', 'mobile'],
          filters: {
            rules: [
              {
                field: 'organization',
                operator: '=',
                value: visit.organizationId,
              },
            ],
          },
          orderBy: 'created_on DESC',
          limit: 50,
        }
      : undefined,
  )

  const { data: deals = [] } = useDeals(
    visit?.organizationId
      ? {
          columns: [
            'id',
            'name',
            'deal_value',
            'stage',
            'expected_closing_date',
          ],
          filters: {
            rules: [
              {
                field: 'organization',
                operator: '=',
                value: visit.organizationId,
              },
            ],
          },
          orderBy: 'created_on DESC',
          limit: 20,
        }
      : undefined,
    { enabled: !!visit?.organizationId },
  )

  const { data: leads = [] } = useLeads(
    visit?.organizationId
      ? {
          columns: ['id', 'title', 'lead_status', 'email', 'phone'],
          filters: {
            rules: [
              {
                field: 'company_name',
                operator: '=',
                value: visit.organizationId,
              },
            ],
          },
          orderBy: 'created_on DESC',
          limit: 20,
        }
      : undefined,
  )

  const { data: salesOrders = [] } = useSalesOrders(
    visit?.organizationId
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
            rules: [
              {
                field: 'organization',
                operator: '=',
                value: visit.organizationId,
              },
            ],
          },
          orderBy: 'created_on DESC',
          limit: 20,
        }
      : undefined,
  )

  const completedOrders = useMemo(
    () =>
      salesOrders.filter((order: any) =>
        getStatusMeta(order.status)
          .name.toLocaleLowerCase('tr')
          .includes('delivered'),
      ).length,
    [salesOrders],
  )

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full max-w-3xl sm:max-w-3xl">
          <SheetHeader className="border-b pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <SheetTitle className="text-xl">
                  {visit?.organizationName || 'Müşteri ziyareti'}
                </SheetTitle>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary">
                    {visit?.source === 'plan'
                      ? 'Planlı ziyaret'
                      : 'Plansız ziyaret'}
                  </Badge>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-4 w-4" />
                    {elapsedLabel}
                  </span>
                </div>
              </div>
              {visit ? (
                <Button
                  onClick={() => {
                    setOrderDialogOpen(true)
                    onStartOrder()
                  }}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Sipariş Oluştur
                </Button>
              ) : null}
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-7rem)] pr-3">
            <div className="space-y-4 px-1 py-4">
              <div className="grid gap-3 md:grid-cols-4">
                <StatCard title="Kişiler" value={contacts.length} />
                <StatCard title="Açık Fırsatlar" value={deals.length} />
                <StatCard title="Potansiyeller" value={leads.length} />
                <StatCard title="Teslim Sipariş" value={completedOrders} />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="h-4 w-4 text-cyan-500" />
                    Müşteri Özeti
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-start gap-2 text-sm">
                    <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <span>{organization?.phone || 'Telefon bilgisi yok'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <span>{organization?.email || 'E-posta bilgisi yok'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm md:col-span-2">
                    <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <span>{organization?.address || 'Adres bilgisi yok'}</span>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="contacts">
                <TabsList>
                  <TabsTrigger value="contacts">
                    <ContactRound className="h-4 w-4" />
                    Kişiler
                  </TabsTrigger>
                  <TabsTrigger value="deals">
                    <DollarSign className="h-4 w-4" />
                    Fırsatlar
                  </TabsTrigger>
                  <TabsTrigger value="leads">
                    <ClipboardList className="h-4 w-4" />
                    Potansiyeller
                  </TabsTrigger>
                  <TabsTrigger value="orders">
                    <ShoppingCart className="h-4 w-4" />
                    Siparişler
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="contacts" className="mt-4 space-y-3">
                  {contacts.length === 0 ? (
                    <Card>
                      <CardContent className="px-4 py-8 text-sm text-muted-foreground">
                        Bu müşteri için kayıtlı kişi bulunmuyor.
                      </CardContent>
                    </Card>
                  ) : (
                    contacts.map((contact: any) => (
                      <Card key={contact.id}>
                        <CardContent className="px-4 py-3">
                          <div className="font-medium">{contact.name}</div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {contact.job_title || 'Görev bilgisi yok'}
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            {contact.email ||
                              contact.mobile ||
                              'İletişim bilgisi yok'}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="deals" className="mt-4 space-y-3">
                  {deals.length === 0 ? (
                    <Card>
                      <CardContent className="px-4 py-8 text-sm text-muted-foreground">
                        Bu müşteri için açık fırsat bulunmuyor.
                      </CardContent>
                    </Card>
                  ) : (
                    deals.map((deal: any) => (
                      <Card key={deal.id}>
                        <CardContent className="flex items-start justify-between gap-4 px-4 py-3">
                          <div>
                            <div className="font-medium">
                              {deal.name || 'Fırsat'}
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              {getStatusMeta(deal.stage).name || 'Aşama yok'}
                            </div>
                          </div>
                          <div className="text-right text-sm font-medium">
                            {deal.deal_value != null
                              ? `${deal.deal_value.toLocaleString()} `
                              : 'Tutar yok'}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="leads" className="mt-4 space-y-3">
                  {leads.length === 0 ? (
                    <Card>
                      <CardContent className="px-4 py-8 text-sm text-muted-foreground">
                        Bu müşteri için potansiyel kayıt bulunmuyor.
                      </CardContent>
                    </Card>
                  ) : (
                    leads.map((lead: any) => (
                      <Card key={lead.id}>
                        <CardContent className="px-4 py-3">
                          <div className="font-medium">
                            {lead.title || 'Potansiyel kayıt'}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {getStatusMeta(lead.lead_status).name ||
                              'Durum yok'}
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            {lead.email || lead.phone || 'İletişim bilgisi yok'}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="orders" className="mt-4 space-y-3">
                  {salesOrders.length === 0 ? (
                    <Card>
                      <CardContent className="px-4 py-8 text-sm text-muted-foreground">
                        Bu müşteri için sipariş bulunmuyor.
                      </CardContent>
                    </Card>
                  ) : (
                    salesOrders.map((order: any) => (
                      <Card key={order.id}>
                        <CardContent className="flex items-start justify-between gap-4 px-4 py-3">
                          <div>
                            <div className="font-medium">
                              Sipariş #{order.id?.slice(0, 8)}
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              {getStatusMeta(order.status).name || 'Durum yok'}
                            </div>
                          </div>
                          <div className="text-right text-sm font-medium">
                            {order.grand_total != null
                              ? `${order.grand_total.toLocaleString()} `
                              : 'Toplam yok'}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {visit ? (
        <FieldSalesQuickOrderDialog
          open={orderDialogOpen}
          onOpenChange={setOrderDialogOpen}
          organizationId={visit.organizationId}
          organizationName={visit.organizationName}
        />
      ) : null}
    </>
  )
}
