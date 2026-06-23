import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDocyrusClient } from '@docyrus/signin'
import { createAppConfigClient } from '@docyrus/app-utils'
import { toast } from 'sonner'
import {
  useBaseCrmPlanApprovalCollection,
  useBaseEventCollection,
} from '@/collections'
import type { BaseEventEntity } from '@/collections/base-event.collection'
import {
  FIELD_SALES_APP_ID,
  getDateKey,
  getFieldSalesConfig,
} from '@/lib/field-sales'

export function useFieldSalesConfig() {
  const client = useDocyrusClient()

  return useQuery({
    queryKey: ['field-sales', 'config'],
    enabled: !!client,
    queryFn: async () => {
      const configClient = createAppConfigClient(client!, FIELD_SALES_APP_ID)
      const config = await configClient.get().catch(() => null)
      return getFieldSalesConfig(
        (config?.data?.fieldSales as Record<string, unknown> | undefined) ??
          undefined,
      )
    },
  })
}

export function useUpdateFieldSalesConfig() {
  const client = useDocyrusClient()
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: async (nextConfig: Record<string, unknown>) => {
      const configClient = createAppConfigClient(client!, FIELD_SALES_APP_ID)
      const current = await configClient.get().catch(() => null)
      const merged = {
        ...(current?.data ?? {}),
        fieldSales: nextConfig,
      }

      return configClient.upsert({ data: merged })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-sales', 'config'] })
      toast.success(t('fieldSales.messages.settingsSaved'))
    },
    onError: (error: any) => {
      toast.error(error?.message || t('fieldSales.messages.settingsSaveError'))
    },
  })
}

const PLAN_COLUMNS = [
  'id',
  'subject',
  'start_date',
  'end_date',
  'actual_start_date',
  'actual_end_date',
  'check_in_time',
  'check_out_time',
  'location',
  'organization(id,name,map_location,phone,email,address)',
  'contact(id,name,map_location,email,mobile)',
  'plan_status',
  'plan_type',
  'cancel_postpone_reason',
  'postponed_to',
  'require_approval',
  'description',
  'plan_approval(id,label,approval_status,revision_message)',
  'record_owner(id,firstname,lastname,email)',
  'created_on',
] as Array<string>

const APPROVAL_COLUMNS = [
  'id',
  'label',
  'start_date',
  'end_date',
  'approval_status',
  'revision_message',
  'plan_owner(id,firstname,lastname,email)',
  'approved_by(id,firstname,lastname,email)',
  'created_on',
] as Array<string>

type FieldSalesPlanRecord = BaseEventEntity & {
  status?: BaseEventEntity['plan_status']
  event_type?: BaseEventEntity['plan_type']
  weekly_plan?: BaseEventEntity['plan_approval']
}

function isFieldSalesPlanRecord(record: BaseEventEntity) {
  return Boolean(record.plan_status || record.plan_type || record.plan_approval)
}

function mapEventToFieldSalesPlan(
  record: BaseEventEntity,
): FieldSalesPlanRecord {
  return {
    ...record,
    status: record.plan_status,
    event_type: record.plan_type,
    weekly_plan: record.plan_approval,
  }
}

function mapFieldSalesPlanPayload(data: Record<string, unknown>) {
  const payload: Record<string, unknown> = { ...data }

  if ('name' in payload && !('subject' in payload)) {
    payload.subject = payload.name
  }

  delete payload.name
  delete payload.all_day

  if ('status' in payload) {
    payload.plan_status = payload.status
    delete payload.status
  }

  if ('event_type' in payload) {
    payload.plan_type = payload.event_type
    delete payload.event_type
  }

  if ('weekly_plan' in payload) {
    payload.plan_approval = payload.weekly_plan
    delete payload.weekly_plan
  }

  return payload
}

export function useFieldSalesPlans() {
  const collection = useBaseEventCollection()

  return useQuery({
    queryKey: ['field-sales', 'plans'],
    queryFn: async () => {
      const records = await collection.list({
        columns: PLAN_COLUMNS,
        orderBy: 'start_date ASC',
        limit: 1000,
      })

      return records
        .filter((record) => isFieldSalesPlanRecord(record))
        .map((record) => mapEventToFieldSalesPlan(record))
    },
  })
}

export function useFieldSalesApprovals() {
  const collection = useBaseCrmPlanApprovalCollection()

  return useQuery({
    queryKey: ['field-sales', 'approvals'],
    queryFn: async () =>
      collection.list({
        columns: APPROVAL_COLUMNS,
        orderBy: 'created_on DESC',
        limit: 200,
      }),
  })
}

export function useCreateFieldSalesPlan() {
  const collection = useBaseEventCollection()
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) =>
      collection.create(mapFieldSalesPlanPayload(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-sales', 'plans'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success(t('fieldSales.messages.planCreated'))
    },
    onError: (error: any) => {
      toast.error(error?.message || t('fieldSales.messages.planCreationError'))
    },
  })
}

export function useUpdateFieldSalesPlan() {
  const collection = useBaseEventCollection()
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: async ({
      planId,
      data,
    }: {
      planId: string
      data: Record<string, unknown>
    }) => collection.update(planId, mapFieldSalesPlanPayload(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-sales', 'plans'] })
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success(t('fieldSales.messages.planUpdated'))
    },
    onError: (error: any) => {
      toast.error(error?.message || t('fieldSales.messages.planUpdateError'))
    },
  })
}

export function useDeleteFieldSalesPlan() {
  const collection = useBaseEventCollection()
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: async (planId: string) => collection.delete(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-sales', 'plans'] })
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success(t('fieldSales.messages.planDeleted'))
    },
    onError: (error: any) => {
      toast.error(error?.message || t('fieldSales.messages.planDeletionError'))
    },
  })
}

export function useCreateFieldSalesApproval() {
  const collection = useBaseCrmPlanApprovalCollection()
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) =>
      collection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-sales', 'approvals'] })
      toast.success(t('fieldSales.messages.planSubmittedForApproval'))
    },
    onError: (error: any) => {
      toast.error(error?.message || t('fieldSales.messages.planSubmissionError'))
    },
  })
}

export function useUpdateFieldSalesApproval() {
  const collection = useBaseCrmPlanApprovalCollection()
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: async ({
      approvalId,
      data,
    }: {
      approvalId: string
      data: Record<string, unknown>
    }) => collection.update(approvalId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-sales', 'approvals'] })
      queryClient.invalidateQueries({ queryKey: ['field-sales', 'plans'] })
      toast.success(t('fieldSales.messages.approvalUpdated'))
    },
    onError: (error: any) => {
      toast.error(error?.message || t('fieldSales.messages.approvalUpdateError'))
    },
  })
}

export function useFieldSalesCurrentApproval(
  approvals: Array<any>,
  ownerId: string | undefined,
  startDate: string,
  endDate: string,
) {
  return useMemo(() => {
    const startKey = startDate ? getDateKey(startDate) : ''
    const endKey = endDate ? getDateKey(endDate) : ''

    return (
      approvals.find((approval) => {
        const planOwnerId =
          typeof approval.plan_owner === 'object'
            ? approval.plan_owner?.id
            : approval.plan_owner
        const approvalStartKey = approval.start_date
          ? getDateKey(approval.start_date)
          : ''
        const approvalEndKey = approval.end_date
          ? getDateKey(approval.end_date)
          : ''

        return (
          planOwnerId === ownerId &&
          approvalStartKey === startKey &&
          approvalEndKey === endKey
        )
      }) ?? null
    )
  }, [approvals, ownerId, startDate, endDate])
}
