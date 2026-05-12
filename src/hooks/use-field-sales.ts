import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDocyrusClient } from '@docyrus/signin'
import { createAppConfigClient } from '@docyrus/app-utils'
import { toast } from 'sonner'
import {
  useBaseCrmPlanApprovalCollection,
  useBaseCrmPlanCollection,
} from '@/collections'
import { FIELD_SALES_APP_ID, getFieldSalesConfig } from '@/lib/field-sales'

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
      toast.success('Saha satış ayarları kaydedildi')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Saha satış ayarları kaydedilemedi')
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
  'all_day',
  'location',
  'organization(id,name,map_location,phone,email,address)',
  'contact(id,name,map_location,email,mobile)',
  'status',
  'event_type',
  'cancel_postpone_reason',
  'postponed_to',
  'require_approval',
  'description',
  'weekly_plan(id,label,approval_status,revision_message)',
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

export function useFieldSalesPlans() {
  const collection = useBaseCrmPlanCollection()

  return useQuery({
    queryKey: ['field-sales', 'plans'],
    queryFn: async () =>
      collection.list({
        columns: PLAN_COLUMNS,
        orderBy: 'start_date ASC',
        limit: 500,
      }),
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
  const collection = useBaseCrmPlanCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) =>
      collection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-sales', 'plans'] })
      toast.success('Plan oluşturuldu')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Plan oluşturulamadı')
    },
  })
}

export function useUpdateFieldSalesPlan() {
  const collection = useBaseCrmPlanCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      planId,
      data,
    }: {
      planId: string
      data: Record<string, unknown>
    }) => collection.update(planId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-sales', 'plans'] })
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      toast.success('Plan güncellendi')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Plan güncellenemedi')
    },
  })
}

export function useCreateFieldSalesApproval() {
  const collection = useBaseCrmPlanApprovalCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) =>
      collection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-sales', 'approvals'] })
      toast.success('Plan onaya gönderildi')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Plan onaya gönderilemedi')
    },
  })
}

export function useUpdateFieldSalesApproval() {
  const collection = useBaseCrmPlanApprovalCollection()
  const queryClient = useQueryClient()

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
      toast.success('Plan onayı güncellendi')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Plan onayı güncellenemedi')
    },
  })
}

export function useFieldSalesCurrentApproval(
  approvals: Array<any>,
  ownerId: string | undefined,
  startDate: string,
  endDate: string,
) {
  return useMemo(
    () =>
      approvals.find((approval) => {
        const planOwnerId =
          typeof approval.plan_owner === 'object'
            ? approval.plan_owner?.id
            : approval.plan_owner

        return (
          planOwnerId === ownerId &&
          approval.start_date === startDate &&
          approval.end_date === endDate
        )
      }) ?? null,
    [approvals, ownerId, startDate, endDate],
  )
}
