import { useMemo, useState } from 'react'
import { format, addMonths, addWeeks } from 'date-fns'
import { useQueryClient } from '@tanstack/react-query'
import { CalendarRange, RefreshCcw, Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { FieldSalesScheduleBoard } from '@/components/field-sales/field-sales-schedule-board'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCompanies } from '@/hooks/use-companies'
import { useContacts } from '@/hooks/use-contacts'
import {
  useCreateFieldSalesPlan,
  useDeleteFieldSalesPlan,
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
  isDateWithinRange,
  type SlotDefinition,
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

function getRelationId(value: any) {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.id ?? ''
}

function getRecordSubtitle(record: SourceRecord) {
  return record.mobile || record.phone || record.email || record.address || ''
}

function getSourceName(record: SourceRecord) {
  return record.name || getRelationName(record.organization) || 'Kayıt'
}

type SourceFilterOption = 'all' | 'unplanned' | 'planned' | 'with_location'
type SourceSortOption = 'name_asc' | 'name_desc'

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
  const deletePlan = useDeleteFieldSalesPlan()
  const planCollection = useBaseEventCollection()
  const approvalCollection = useBaseCrmPlanApprovalCollection()

  const [anchorDate, setAnchorDate] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [sourceFilter, setSourceFilter] =
    useState<SourceFilterOption>('all')
  const [sourceSort, setSourceSort] = useState<SourceSortOption>('name_asc')
  const [pendingDeletePlan, setPendingDeletePlan] =
    useState<PlanRecord | null>(null)
  const [optimisticApprovalRangeKeys, setOptimisticApprovalRangeKeys] =
    useState<Array<string>>([])
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

  const plannedSourceIds = useMemo(() => {
    const ids = new Set<string>()

    for (const plan of scopedPlans) {
      const sourceId =
        plannerConfig.planningEntity === 'contact'
          ? getRelationId(plan.contact)
          : getRelationId(plan.organization)

      if (sourceId) {
        ids.add(sourceId)
      }
    }

    return ids
  }, [plannerConfig.planningEntity, scopedPlans])

  const sourceItems = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase('tr')

    return [...sourceRecords]
      .filter((record) => {
        const sourceId = record.id || ''
        const hasLocation = Boolean(record.map_location)
        const isPlanned = plannedSourceIds.has(sourceId)

        if (term) {
          const matchesTerm = `${getSourceName(record)} ${getRecordSubtitle(record)}`
            .toLocaleLowerCase('tr')
            .includes(term)

          if (!matchesTerm) {
            return false
          }
        }

        if (sourceFilter === 'planned' && !isPlanned) return false
        if (sourceFilter === 'unplanned' && isPlanned) return false
        if (sourceFilter === 'with_location' && !hasLocation) return false

        return true
      })
      .sort((left, right) => {
        const comparison = getSourceName(left).localeCompare(getSourceName(right), 'tr', {
          sensitivity: 'base',
        })

        return sourceSort === 'name_desc' ? comparison * -1 : comparison
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
  }, [
    plannedSourceIds,
    plannerConfig.planningEntity,
    searchTerm,
    sourceFilter,
    sourceRecords,
    sourceSort,
  ])

  const approvalRangeKey = `${format(approvalRange.start, 'yyyy-MM-dd')}|${format(
    approvalRange.end,
    'yyyy-MM-dd',
  )}`
  const currentApprovalCode = getFieldSalesApprovalStatusCode(
    currentApproval?.approval_status,
  )
  const isOptimisticallyPending =
    !currentApprovalCode && optimisticApprovalRangeKeys.includes(approvalRangeKey)
  const effectiveCurrentApprovalCode =
    currentApprovalCode ||
    (isOptimisticallyPending ? 'waiting_for_approval' : '')
  const planEditingLocked =
    effectiveCurrentApprovalCode === 'waiting_for_approval' ||
    effectiveCurrentApprovalCode === 'approved'

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
      queryClient.invalidateQueries({ queryKey: ['events'] }),
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
            plan_approval: approval.id,
            require_approval: true,
          }),
        ),
    )

    setOptimisticApprovalRangeKeys((current) =>
      current.includes(approvalRangeKey)
        ? current
        : [...current, approvalRangeKey],
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

    setOptimisticApprovalRangeKeys((current) =>
      current.includes(approvalRangeKey)
        ? current
        : [...current, approvalRangeKey],
    )

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

  const confirmDeletePlan = async () => {
    if (!pendingDeletePlan?.id) return
    await deletePlan.mutateAsync(pendingDeletePlan.id)
    setPendingDeletePlan(null)
  }

  return (
    <>
      <PageHeader
        title="Planlama"
        icon={<CalendarRange className="h-4 w-4 text-cyan-500" />}
        titleSuffix={
          <Badge variant="secondary">{scopedPlans.length} plan</Badge>
        }
      />
      <PageContainer className="space-y-4 overflow-x-hidden px-3 sm:px-4 lg:px-6">
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Aktif dönem
              </p>
              <p className="text-base font-semibold">
                {format(approvalRange.start, 'dd MMM yyyy')} –{' '}
                {format(approvalRange.end, 'dd MMM yyyy')}
              </p>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <Button variant="outline" size="sm" onClick={() => navigateRange('prev')}>
                Önceki
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateRange('next')}>
                Sonraki
              </Button>
            </div>
          </CardContent>
        </Card>

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
          sourceToolbar={
            <div className="space-y-3">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={
                  plannerConfig.planningEntity === 'contact'
                    ? 'Kişi ara'
                    : 'Firma ara'
                }
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <Select
                  value={sourceFilter}
                  onValueChange={(value) =>
                    setSourceFilter(value as SourceFilterOption)
                  }
                >
                  <SelectTrigger className="w-full" size="sm">
                    <SelectValue placeholder="Filtrele" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm kayıtlar</SelectItem>
                    <SelectItem value="unplanned">
                      Henüz planlanmayanlar
                    </SelectItem>
                    <SelectItem value="planned">Planda olanlar</SelectItem>
                    <SelectItem value="with_location">
                      Konumu olanlar
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={sourceSort}
                  onValueChange={(value) =>
                    setSourceSort(value as SourceSortOption)
                  }
                >
                  <SelectTrigger className="w-full" size="sm">
                    <SelectValue placeholder="Sırala" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name_asc">Ada göre (A-Z)</SelectItem>
                    <SelectItem value="name_desc">Ada göre (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                {sourceItems.length} kayıt listeleniyor
              </p>
            </div>
          }
          title="Plan Takvimi"
          titleToolbar={
            currentApprovalCode === 'revision_requested' ? (
              <Button className="w-full sm:w-auto" onClick={resubmitRevision}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Tekrar Onaya Gönder
              </Button>
            ) : currentApproval || isOptimisticallyPending ? (
              <Button className="w-full sm:w-auto" variant="secondary" disabled>
                {effectiveCurrentApprovalCode === 'approved'
                  ? 'Plan onaylandı'
                  : 'Plan onay bekliyor'}
              </Button>
            ) : (
              <Button className="w-full sm:w-auto" onClick={submitRangeForApproval}>
                <Send className="mr-2 h-4 w-4" />
                {approvalMode === 'monthly'
                  ? 'Aylık Planı Onaya Gönder'
                  : 'Haftalık Planı Onaya Gönder'}
              </Button>
            )
          }
          days={days}
          slots={slots}
          plans={scopedPlans}
          canDragPlan={(plan) => canEditPlan(plan as PlanRecord)}
          canDeletePlan={(plan) => canEditPlan(plan as PlanRecord)}
          onDeletePlan={(plan) => setPendingDeletePlan(plan as PlanRecord)}
          onDropToSlot={handleDropToSlot}
        />
      </PageContainer>

      <AlertDialog
        open={pendingDeletePlan !== null}
        onOpenChange={(open) => {
          if (!open && !deletePlan.isPending) {
            setPendingDeletePlan(null)
          }
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <AlertDialogTitle>Plan silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeletePlan
                ? `${pendingDeletePlan.subject || getRelationName(pendingDeletePlan.organization) || getRelationName(pendingDeletePlan.contact) || 'Seçili plan'} takvimden kaldırılacak.`
                : 'Seçili plan takvimden kaldırılacak.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePlan.isPending}>
              Vazgeç
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deletePlan.isPending}
              onClick={confirmDeletePlan}
            >
              {deletePlan.isPending ? 'Siliniyor...' : 'Planı Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
