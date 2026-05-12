import { useMemo, useState } from 'react'
import { format, addMonths, addWeeks } from 'date-fns'
import { useQueryClient } from '@tanstack/react-query'
import { CalendarRange, RefreshCcw, Send } from 'lucide-react'
import { toast } from 'sonner'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { FieldSalesScheduleBoard } from '@/components/field-sales/field-sales-schedule-board'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useCompanies } from '@/hooks/use-companies'
import { useContacts } from '@/hooks/use-contacts'
import {
  useCreateFieldSalesPlan,
  useFieldSalesApprovals,
  useFieldSalesConfig,
  useFieldSalesCurrentApproval,
  useFieldSalesPlans,
  useUpdateFieldSalesPlan,
} from '@/hooks/use-field-sales'
import { useMyInfo, useUsers } from '@/hooks/use-users'
import {
  FIELD_SALES_APPROVAL_STATUS_IDS,
  FIELD_SALES_EVENT_TYPE_IDS,
  FIELD_SALES_PLAN_STATUS_IDS,
  buildIsoDateTime,
  buildSlotEndIso,
  generateSlotDefinitions,
  getApprovalLabel,
  getApprovalRange,
  getFieldSalesApprovalStatusCode,
  getFieldSalesPlanningDays,
  getRelationName,
  getStatusMeta,
  isDateWithinRange,
  type SlotDefinition,
} from '@/lib/field-sales'
import {
  useBaseCrmPlanApprovalCollection,
  useBaseCrmPlanCollection,
} from '@/collections'

type PlanRecord = {
  id?: string
  subject?: string
  start_date?: string
  end_date?: string
  status?: unknown
  event_type?: unknown
  organization?: any
  contact?: any
  weekly_plan?: any
  record_owner?: any
  location?: Record<string, unknown> | null
}

type SourceRecord = {
  id?: string
  name?: string
  phone?: string
  email?: string
  mobile?: string
  address?: string
  map_location?: Record<string, unknown> | null
  organization?: { id?: string; name?: string } | string
}

function getUserId(value: any) {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.id ?? ''
}

function getRecordSubtitle(record: SourceRecord) {
  return record.mobile || record.phone || record.email || record.address || ''
}

function getApprovalStatusBadge(approval: any) {
  const status = getStatusMeta(approval?.approval_status)
  if (!status.name) return null

  return <Badge variant="secondary">{status.name}</Badge>
}

function getSourceName(record: SourceRecord) {
  return record.name || getRelationName(record.organization) || 'Kayıt'
}

export function FieldSalesPlansPage() {
  const queryClient = useQueryClient()
  const { data: config } = useFieldSalesConfig()
  const { data: allPlans = [] } = useFieldSalesPlans()
  const { data: approvals = [] } = useFieldSalesApprovals()
  const { data: users = [] } = useUsers()
  const { data: myInfo } = useMyInfo()
  const { data: companies = [] } = useCompanies({
    columns: ['id', 'name', 'phone', 'email', 'address', 'map_location'],
    orderBy: 'name ASC',
    limit: 300,
  })
  const { data: contacts = [] } = useContacts({
    columns: [
      'id',
      'name',
      'mobile',
      'email',
      'map_location',
      'organization(id,name)',
    ],
    orderBy: 'name ASC',
    limit: 300,
  })
  const createPlan = useCreateFieldSalesPlan()
  const updatePlan = useUpdateFieldSalesPlan()
  const planCollection = useBaseCrmPlanCollection()
  const approvalCollection = useBaseCrmPlanApprovalCollection()

  const [anchorDate, setAnchorDate] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const activeConfig = config
  const plannerConfig = activeConfig ?? {
    approvalMode: 'weekly',
    planningEntity: 'organization',
    slotMinutes: 30,
    locationCheckEnabled: true,
    allowedDistanceMeters: 250,
    showWeekends: false,
    dayStartTime: '09:00',
    dayEndTime: '18:00',
  }
  const approvalMode = plannerConfig.approvalMode
  const showWeekends = plannerConfig.showWeekends
  const slots = generateSlotDefinitions(plannerConfig)

  const days = useMemo(
    () => getFieldSalesPlanningDays(anchorDate, approvalMode, showWeekends),
    [anchorDate, approvalMode, showWeekends],
  )

  const approvalRange = useMemo(
    () => getApprovalRange(anchorDate, approvalMode, showWeekends),
    [anchorDate, approvalMode, showWeekends],
  )

  const ownerId = myInfo?.id
  const scopedPlans = useMemo(
    () =>
      (allPlans as Array<PlanRecord>).filter((plan) => {
        const planOwnerId = getUserId(plan.record_owner)
        const belongsToCurrentUser = ownerId ? planOwnerId === ownerId : true

        return (
          belongsToCurrentUser &&
          isDateWithinRange(
            plan.start_date,
            approvalRange.start,
            approvalRange.end,
          )
        )
      }),
    [allPlans, approvalRange.end, approvalRange.start, ownerId],
  )

  const currentApproval = useFieldSalesCurrentApproval(
    approvals,
    ownerId,
    format(approvalRange.start, 'yyyy-MM-dd'),
    format(approvalRange.end, 'yyyy-MM-dd'),
  )

  const sourceRecords = useMemo<Array<SourceRecord>>(() => {
    return plannerConfig.planningEntity === 'contact'
      ? (contacts as Array<SourceRecord>)
      : (companies as Array<SourceRecord>)
  }, [companies, contacts, plannerConfig.planningEntity])

  const sourceItems = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase('tr')

    return sourceRecords
      .filter((record) => {
        if (!term) return true
        return `${getSourceName(record)} ${getRecordSubtitle(record)}`
          .toLocaleLowerCase('tr')
          .includes(term)
      })
      .map((record) => ({
        id: record.id || '',
        title: getSourceName(record),
        subtitle:
          plannerConfig.planningEntity === 'contact'
            ? getRelationName(record.organization)
            : record.address || '',
        detail: getRecordSubtitle(record),
      }))
  }, [plannerConfig.planningEntity, searchTerm, sourceRecords])

  const currentApprovalCode = getFieldSalesApprovalStatusCode(
    currentApproval?.approval_status,
  )
  const planEditingLocked =
    currentApprovalCode === 'waiting_for_approval' ||
    currentApprovalCode === 'approved'

  const canEditPlan = (plan: PlanRecord) => {
    if (!plan.id) return false
    if (!plan.weekly_plan) return !planEditingLocked

    const linkedApproval =
      typeof plan.weekly_plan === 'object'
        ? plan.weekly_plan.approval_status
        : plan.weekly_plan
    const linkedApprovalCode = getFieldSalesApprovalStatusCode(linkedApproval)

    return !['waiting_for_approval', 'approved'].includes(linkedApprovalCode)
  }

  const handleDropToSlot = async (
    payload: { type: 'source' | 'plan'; id: string },
    day: Date,
    slot: SlotDefinition,
  ) => {
    if (!myInfo?.id) return
    if (planEditingLocked) {
      toast.error('Onay bekleyen veya onaylı planlar düzenlenemez')
      return
    }

    const startDate = buildIsoDateTime(day, slot.start)
    const endDate = buildSlotEndIso(day, slot.start, plannerConfig.slotMinutes)

    if (payload.type === 'source') {
      const record = sourceRecords.find((item) => item.id === payload.id)
      if (!record?.id) return

      const basePayload: Record<string, unknown> = {
        name: getSourceName(record),
        subject: getSourceName(record),
        start_date: startDate,
        end_date: endDate,
        status: FIELD_SALES_PLAN_STATUS_IDS.waiting,
        event_type: FIELD_SALES_EVENT_TYPE_IDS.plannedVisit,
        require_approval: true,
        record_owner: myInfo.id,
        location: record.map_location ?? null,
      }

      if (plannerConfig.planningEntity === 'organization') {
        basePayload.organization = record.id
      } else {
        basePayload.contact = record.id
        if (record.organization && typeof record.organization === 'object') {
          basePayload.organization = record.organization.id
        }
      }

      await createPlan.mutateAsync(basePayload)
      return
    }

    const plan = scopedPlans.find((item) => item.id === payload.id)
    if (!plan?.id) return
    if (!canEditPlan(plan)) {
      toast.error('Bu plan onay sürecinde olduğu için taşınamaz')
      return
    }

    await updatePlan.mutateAsync({
      planId: plan.id,
      data: {
        start_date: startDate,
        end_date: endDate,
      },
    })
  }

  const refreshQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['field-sales', 'plans'] }),
      queryClient.invalidateQueries({ queryKey: ['field-sales', 'approvals'] }),
    ])
  }

  const submitRangeForApproval = async () => {
    if (!myInfo?.id) return
    if (scopedPlans.length === 0) {
      toast.error('Onaya göndermek için seçili dönemde en az bir plan olmalı')
      return
    }

    const approver = users.find((user) => user.id && user.id !== myInfo.id)

    const approval = await approvalCollection.create({
      label: getApprovalLabel(anchorDate, myInfo, approvalMode),
      start_date: format(approvalRange.start, 'yyyy-MM-dd'),
      end_date: format(approvalRange.end, 'yyyy-MM-dd'),
      approval_status: FIELD_SALES_APPROVAL_STATUS_IDS.waitingForApproval,
      revision_message: '',
      plan_owner: myInfo.id,
      approved_by: approver?.id,
      record_owner: myInfo.id,
      name: getApprovalLabel(anchorDate, myInfo, approvalMode),
    })

    await Promise.all(
      scopedPlans
        .filter((plan) => plan.id)
        .map((plan) =>
          planCollection.update(plan.id!, {
            weekly_plan: approval.id,
            require_approval: true,
          }),
        ),
    )

    await refreshQueries()
    toast.success('Plan onaya gönderildi')
  }

  const resubmitRevision = async () => {
    if (!currentApproval?.id) return

    await approvalCollection.update(currentApproval.id, {
      approval_status: FIELD_SALES_APPROVAL_STATUS_IDS.waitingForApproval,
      revision_message: '',
    })

    await refreshQueries()
    toast.success('Revize edilen plan tekrar onaya gönderildi')
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
        title="Planlama"
        icon={<CalendarRange className="h-4 w-4 text-cyan-500" />}
        titleSuffix={
          <Badge variant="secondary">{scopedPlans.length} plan</Badge>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => navigateRange('prev')}>
              Önceki
            </Button>
            <Button variant="outline" onClick={() => setAnchorDate(new Date())}>
              Bugün
            </Button>
            <Button variant="outline" onClick={() => navigateRange('next')}>
              Sonraki
            </Button>
            {currentApprovalCode === 'revision_requested' ? (
              <Button onClick={resubmitRevision}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Tekrar Onaya Gönder
              </Button>
            ) : currentApproval ? (
              <Button variant="secondary" disabled>
                {currentApprovalCode === 'approved'
                  ? 'Plan onaylandı'
                  : 'Plan onay bekliyor'}
              </Button>
            ) : (
              <Button onClick={submitRangeForApproval}>
                <Send className="mr-2 h-4 w-4" />
                {approvalMode === 'monthly'
                  ? 'Aylık Planı Onaya Gönder'
                  : 'Haftalık Planı Onaya Gönder'}
              </Button>
            )}
          </div>
        }
      />
      <PageContainer className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <div className="text-sm text-muted-foreground">Aktif dönem</div>
                <div className="text-lg font-semibold">
                  {format(approvalRange.start, 'dd MMM yyyy')} –{' '}
                  {format(approvalRange.end, 'dd MMM yyyy')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getApprovalStatusBadge(currentApproval)}
                <Badge variant="outline">
                  {plannerConfig.planningEntity === 'contact'
                    ? 'Kişi planı'
                    : 'Firma planı'}
                </Badge>
                <Badge variant="outline">
                  {plannerConfig.slotMinutes === 60 ? 'Saatlik' : '30 dakika'}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={
                  plannerConfig.planningEntity === 'contact'
                    ? 'Kişi ara'
                    : 'Firma ara'
                }
              />
            </CardContent>
          </Card>
        </div>

        {currentApprovalCode === 'revision_requested' ? (
          <Alert>
            <AlertTitle>Revizyon bekleniyor</AlertTitle>
            <AlertDescription>
              {currentApproval?.revision_message ||
                'Yönetici planın güncellenmesini talep etti.'}
            </AlertDescription>
          </Alert>
        ) : null}

        <FieldSalesScheduleBoard
          sourceTitle={
            plannerConfig.planningEntity === 'contact' ? 'Kişiler' : 'Firmalar'
          }
          sourceItems={sourceItems}
          sourceEmptyText="Bu filtre ile eşleşen kayıt bulunamadı"
          title="Plan Takvimi"
          days={days}
          slots={slots}
          plans={scopedPlans}
          canDragPlan={(plan) => canEditPlan(plan as PlanRecord)}
          onDropToSlot={handleDropToSlot}
        />
      </PageContainer>
    </>
  )
}
