import { useEffect, useMemo, useState } from 'react'
import { format, parseISO, addMonths, addWeeks } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useQueryClient } from '@tanstack/react-query'
import { CalendarCheck2, CheckCheck, MessageSquareReply } from 'lucide-react'
import { toast } from 'sonner'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { FieldSalesScheduleBoard } from '@/components/field-sales/field-sales-schedule-board'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import {
  useFieldSalesApprovals,
  useFieldSalesConfig,
  useFieldSalesPlans,
} from '@/hooks/use-field-sales'
import { useMyInfo } from '@/hooks/use-users'
import {
  FIELD_SALES_APPROVAL_STATUS_IDS,
  FIELD_SALES_PLAN_STATUS_IDS,
  generateSlotDefinitions,
  getApprovalRange,
  getFieldSalesApprovalStatusCode,
  getFieldSalesPlanningDays,
  getStatusMeta,
  isDateWithinRange,
} from '@/lib/field-sales'
import {
  useBaseCrmPlanApprovalCollection,
  useBaseEventCollection,
} from '@/collections'

type PlanRecord = {
  id?: string
  subject?: string
  start_date?: string
  end_date?: string
  status?: unknown
  event_type?: unknown
  organization?: unknown
  contact?: unknown
  weekly_plan?: any
}

type ApprovalRecord = {
  id?: string
  label?: string
  start_date?: string
  end_date?: string
  approval_status?: unknown
  revision_message?: string
  plan_owner?: any
  approved_by?: any
  created_on?: string
}

function getApprovalOwnerLabel(approval: ApprovalRecord) {
  if (!approval.plan_owner) return 'Plan sahibi yok'
  if (typeof approval.plan_owner === 'string') return approval.plan_owner
  return (
    [approval.plan_owner.firstname, approval.plan_owner.lastname]
      .filter(Boolean)
      .join(' ') ||
    approval.plan_owner.name ||
    approval.plan_owner.email ||
    'Plan sahibi'
  )
}

function formatApprovalDate(value?: string) {
  if (!value) return '—'

  try {
    return format(parseISO(value), 'dd MMM yyyy', { locale: tr })
  } catch {
    return value
  }
}

export function FieldSalesApprovalsPage() {
  const queryClient = useQueryClient()
  const { data: config } = useFieldSalesConfig()
  const { data: approvals = [] } = useFieldSalesApprovals()
  const { data: plans = [] } = useFieldSalesPlans()
  const { data: myInfo } = useMyInfo()
  const approvalCollection = useBaseCrmPlanApprovalCollection()
  const planCollection = useBaseEventCollection()

  const [anchorDate, setAnchorDate] = useState(new Date())
  const [selectedApprovalId, setSelectedApprovalId] = useState<string>('')
  const [revisionMessage, setRevisionMessage] = useState('')

  const approvalMode = config?.approvalMode ?? 'weekly'
  const showWeekends = config?.showWeekends ?? false
  const approvalRange = useMemo(
    () => getApprovalRange(anchorDate, approvalMode, showWeekends),
    [anchorDate, approvalMode, showWeekends],
  )

  const visibleApprovals = useMemo(
    () =>
      (approvals as Array<ApprovalRecord>).filter(
        (approval) =>
          isDateWithinRange(
            approval.start_date,
            approvalRange.start,
            approvalRange.end,
          ) ||
          isDateWithinRange(
            approval.end_date,
            approvalRange.start,
            approvalRange.end,
          ),
      ),
    [approvalRange.end, approvalRange.start, approvals],
  )

  useEffect(() => {
    if (!selectedApprovalId && visibleApprovals[0]?.id) {
      setSelectedApprovalId(visibleApprovals[0].id)
    }

    if (
      selectedApprovalId &&
      !visibleApprovals.some((approval) => approval.id === selectedApprovalId)
    ) {
      setSelectedApprovalId(visibleApprovals[0]?.id || '')
    }
  }, [selectedApprovalId, visibleApprovals])

  const selectedApproval = useMemo(
    () =>
      visibleApprovals.find((approval) => approval.id === selectedApprovalId) ||
      null,
    [selectedApprovalId, visibleApprovals],
  )

  useEffect(() => {
    setRevisionMessage(selectedApproval?.revision_message || '')
  }, [selectedApproval?.id, selectedApproval?.revision_message])

  const selectedApprovalStatusCode = getFieldSalesApprovalStatusCode(
    selectedApproval?.approval_status,
  )
  const selectedApprovalStatusMeta = getStatusMeta(
    selectedApproval?.approval_status,
  )
  const approvalActionMeta =
    selectedApprovalStatusCode === 'revision_requested'
      ? {
          title: 'Revizyon',
          description:
            'Bu kayıt için revizyon istendi. Plan sahibi gerekli değişiklikleri yapıp planı tekrar onaya gönderene kadar onay verilemez.',
        }
      : selectedApprovalStatusCode === 'approved'
        ? {
            title: 'Onay Tamamlandı',
            description: 'Bu plan onaylandı.',
          }
        : {
            title: 'Plan Onayı',
            description: '',
          }

  const boardDays = useMemo(() => {
    if (!selectedApproval?.start_date) {
      return getFieldSalesPlanningDays(anchorDate, approvalMode, showWeekends)
    }

    return getFieldSalesPlanningDays(
      parseISO(selectedApproval.start_date),
      approvalMode,
      showWeekends,
    )
  }, [anchorDate, approvalMode, selectedApproval?.start_date, showWeekends])

  const slots = generateSlotDefinitions(
    config || {
      approvalMode: 'weekly',
      planningEntity: 'organization',
      slotMinutes: 30,
      locationCheckEnabled: true,
      allowedDistanceMeters: 250,
      showWeekends: false,
      dayStartTime: '09:00',
      dayEndTime: '18:00',
    },
  )

  const relatedPlans = useMemo(
    () =>
      (plans as Array<PlanRecord>).filter((plan) => {
        const weeklyPlanId =
          typeof plan.weekly_plan === 'object'
            ? plan.weekly_plan?.id
            : plan.weekly_plan
        return selectedApproval?.id
          ? weeklyPlanId === selectedApproval.id
          : false
      }),
    [plans, selectedApproval?.id],
  )

  const groupedApprovals = useMemo(() => {
    return visibleApprovals.reduce<Record<string, Array<ApprovalRecord>>>(
      (accumulator, approval) => {
        const status = getStatusMeta(approval.approval_status).name || 'Diğer'
        accumulator[status] = accumulator[status] || []
        accumulator[status].push(approval)
        return accumulator
      },
      {},
    )
  }, [visibleApprovals])

  const refreshQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['field-sales', 'plans'] }),
      queryClient.invalidateQueries({ queryKey: ['field-sales', 'approvals'] }),
      queryClient.invalidateQueries({ queryKey: ['events'] }),
    ])
  }

  const approveSelected = async () => {
    if (!selectedApproval?.id || !myInfo?.id) return
    if (selectedApprovalStatusCode !== 'waiting_for_approval') {
      toast.error('Bu kayıt şu anda onaya açık değil')
      return
    }

    await approvalCollection.update(selectedApproval.id, {
      approval_status: FIELD_SALES_APPROVAL_STATUS_IDS.approved,
      approved_by: myInfo.id,
      revision_message: '',
    })

    await Promise.all(
      relatedPlans
        .filter((plan) => plan.id)
        .map((plan) =>
          planCollection.update(plan.id!, {
            plan_status: FIELD_SALES_PLAN_STATUS_IDS.waiting,
          }),
        ),
    )

    await refreshQueries()
    toast.success('Plan onaylandı')
  }

  const requestRevision = async () => {
    if (!selectedApproval?.id) return
    if (selectedApprovalStatusCode === 'approved') {
      toast.error('Onaylanan plan için revizyon istenemez')
      return
    }
    if (!revisionMessage.trim()) {
      toast.error('Revizyon mesajı girin')
      return
    }

    await approvalCollection.update(selectedApproval.id, {
      approval_status: FIELD_SALES_APPROVAL_STATUS_IDS.revisionRequested,
      revision_message: revisionMessage.trim(),
    })

    await refreshQueries()
    toast.success('Revizyon talebi kaydedildi')
  }

  const navigateRange = (direction: 'prev' | 'next') => {
    setAnchorDate((current) =>
      approvalMode === 'monthly'
        ? direction === 'next'
          ? addMonths(current, 1)
          : addMonths(current, -1)
        : direction === 'next'
          ? addWeeks(current, 1)
          : addWeeks(current, -1),
    )
  }

  return (
    <>
      <PageHeader
        title="Plan Onayları"
        icon={<CalendarCheck2 className="h-4 w-4 text-cyan-500" />}
        titleSuffix={
          <Badge variant="secondary">{visibleApprovals.length}</Badge>
        }
        actions={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateRange('prev')}
            >
              Önceki
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAnchorDate(new Date())}
            >
              Bugün
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateRange('next')}
            >
              Sonraki
            </Button>
          </div>
        }
      />
      <PageContainer className="grid gap-4 overflow-x-hidden px-3 sm:px-4 lg:px-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Onay Kuyruğu</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[55vh] pr-3 xl:h-[calc(100vh-18rem)]">
              <div className="space-y-4">
                {Object.entries(groupedApprovals).map(
                  ([statusLabel, items]) => (
                    <div key={statusLabel} className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {statusLabel}
                      </div>
                      {items.map((approval) => {
                        const isActive = approval.id === selectedApprovalId
                        return (
                          <button
                            key={approval.id}
                            type="button"
                            onClick={() =>
                              setSelectedApprovalId(approval.id || '')
                            }
                            className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                              isActive
                                ? 'border-primary bg-primary/5'
                                : 'bg-card hover:border-primary/30 hover:bg-muted/40'
                            }`}
                          >
                            <div className="font-medium">{approval.label}</div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              {getApprovalOwnerLabel(approval)}
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              {formatApprovalDate(approval.start_date)} –{' '}
                              {formatApprovalDate(approval.end_date)}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ),
                )}
                {visibleApprovals.length === 0 ? (
                  <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                    Bu döneme ait plan onayı bulunmuyor.
                  </div>
                ) : null}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm text-muted-foreground">
                  Seçili kayıt
                </div>
                <div className="text-lg font-semibold">
                  {selectedApproval?.label || 'Plan onayı seçin'}
                </div>
              </div>
              {selectedApproval ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {getApprovalOwnerLabel(selectedApproval)}
                  </Badge>
                  <Badge variant="secondary">
                    {selectedApprovalStatusMeta.name}
                  </Badge>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {selectedApproval ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
              <FieldSalesScheduleBoard
                title="Onay Takvimi"
                days={boardDays}
                slots={slots}
                plans={relatedPlans}
                readOnly
              />

              <Card>
                <CardHeader>
                  <CardTitle>{approvalActionMeta.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <div>
                      Dönem: {formatApprovalDate(selectedApproval.start_date)} –{' '}
                      {formatApprovalDate(selectedApproval.end_date)}
                    </div>
                    <div>Plan sayısı: {relatedPlans.length}</div>
                    <div>Son durum: {selectedApprovalStatusMeta.name}</div>
                  </div>

                  {approvalActionMeta.description ? (
                    <div className="rounded-lg border bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
                      {approvalActionMeta.description}
                    </div>
                  ) : null}

                  {selectedApprovalStatusCode === 'waiting_for_approval' ? (
                    <>
                      <Button className="w-full" onClick={approveSelected}>
                        <CheckCheck className="mr-2 h-4 w-4" />
                        Planı Onayla
                      </Button>

                      <div className="space-y-2">
                        <Label htmlFor="revision-message">
                          Revizyon mesajı
                        </Label>
                        <Textarea
                          id="revision-message"
                          value={revisionMessage}
                          onChange={(event) =>
                            setRevisionMessage(event.target.value)
                          }
                          rows={6}
                          placeholder="Planın hangi kısımlarının güncellenmesi gerektiğini yazın"
                        />
                      </div>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={requestRevision}
                      >
                        <MessageSquareReply className="mr-2 h-4 w-4" />
                        Revizyon Talep Et
                      </Button>
                    </>
                  ) : null}

                  {selectedApprovalStatusCode === 'revision_requested' ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="revision-message">
                          Revizyon mesajı
                        </Label>
                        <Textarea
                          id="revision-message"
                          value={revisionMessage}
                          onChange={(event) =>
                            setRevisionMessage(event.target.value)
                          }
                          rows={6}
                          placeholder="Planın hangi kısımlarının güncellenmesi gerektiğini yazın"
                        />
                      </div>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={requestRevision}
                      >
                        <MessageSquareReply className="mr-2 h-4 w-4" />
                        Revizyon Mesajını Güncelle
                      </Button>
                    </>
                  ) : null}

                  {selectedApprovalStatusCode === 'approved' ? (
                    <Button className="w-full" disabled>
                      <CheckCheck className="mr-2 h-4 w-4" />
                      Plan Onaylandı
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </PageContainer>
    </>
  )
}
