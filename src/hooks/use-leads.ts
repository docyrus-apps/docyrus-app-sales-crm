import { useTranslation } from 'react-i18next'
import type { ICollectionListParams } from '@/collections/types'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useBaseCrmLeadsCollection } from '@/collections'

interface UseLeadsOptions {
  enabled?: boolean;
}

export const LEAD_LIST_COLUMNS = [
  'id',
  'name',
  'phone',
  'email',
  'website',
  'company_name_text',
  'company_email',
  'company_phone',
  'company_industry',
  'company_size',
  'lead_source',
  'lead_status',
  'lead_type',
  'leads_products_tags',
  'countries(id,name)',
  'record_owner',
  'deal_value',
  'converted_organization(id,name)',
  'converted_contact(id,name)',
  'converted_deal(id,name)',
  'converted_on',
  'conversion_state',
  'conversion_mode',
  'created_on'
]

export const LEAD_DETAIL_COLUMNS = [
  'id',
  'name',
  'phone',
  'email',
  'website',
  'address',
  'city',
  'state',
  'lead_source',
  'lead_status',
  'lead_type',
  'lead_category',
  'contact_person(id,name)',
  'contact_message',
  'contact_job_title',
  'company_name_text',
  'company_email',
  'company_phone',
  'company_industry',
  'company_size',
  'leads_products_tags',
  'lost_reason',
  'deal_value',
  'countries(id,name)',
  'record_owner',
  'converted_organization(id,name)',
  'converted_contact(id,name)',
  'converted_deal(id,name)',
  'converted_on',
  'converted_by(firstname,lastname)',
  'conversion_state',
  'conversion_mode',
  'conversion_error_message',
  'created_on'
]

/**
 * Hook to list leads with optional filters
 */
export function useLeads(
  params?: ICollectionListParams,
  options: UseLeadsOptions = {}
) {
  const leadsCollection = useBaseCrmLeadsCollection()

  return useQuery({
    queryKey: ['leads', params],
    queryFn: async () => {
      const response = await leadsCollection.list({
        ...params,
        columns: params?.columns || LEAD_LIST_COLUMNS,
        orderBy: params?.orderBy || 'created_on DESC'
      })

      return response
    },
    enabled: options.enabled
  })
}

/**
 * Hook to get a single lead by ID
 */
export function useLead(leadId: string | undefined) {
  const leadsCollection = useBaseCrmLeadsCollection()

  return useQuery({
    queryKey: ['leads', leadId],
    queryFn: async () => {
      if (!leadId) {
        throw new Error('Lead ID is required')
      }
      const response = await leadsCollection.get(leadId, {
        columns: LEAD_DETAIL_COLUMNS
      })

      return response
    },
    enabled: !!leadId
  })
}

/**
 * Hook to create a new lead
 */
export function useCreateLead() {
  const { t } = useTranslation()
  const leadsCollection = useBaseCrmLeadsCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await leadsCollection.create(data)

      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('leads.createdSuccess'))
    },
    onError: (error: any) => {
      toast.error(error?.message || t('leads.createError'))
    }
  })
}

/**
 * Hook to update a lead
 */
export function useUpdateLead() {
  const { t } = useTranslation()
  const leadsCollection = useBaseCrmLeadsCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ leadId, data }: { leadId: string; data: any }) => {
      const response = await leadsCollection.update(leadId, data)

      return response
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['leads', variables.leadId] })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('leads.updatedSuccess'))
    },
    onError: (error: any) => {
      toast.error(error?.message || t('leads.updateError'))
    }
  })
}

/**
 * Hook to delete a lead
 */
export function useDeleteLead() {
  const { t } = useTranslation()
  const leadsCollection = useBaseCrmLeadsCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (leadId: string) => {
      await leadsCollection.delete(leadId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('leads.deletedSuccess'))
    },
    onError: (error: any) => {
      toast.error(error?.message || t('leads.deleteError'))
    }
  })
}

/**
 * Hook to delete multiple leads
 */
export function useDeleteLeads() {
  const { t } = useTranslation()
  const leadsCollection = useBaseCrmLeadsCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (leadIds: Array<string>) => {
      await leadsCollection.deleteMany({ recordIds: leadIds })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('leads.bulkDeletedSuccess'))
    },
    onError: (error: any) => {
      toast.error(error?.message || t('leads.bulkDeleteError'))
    }
  })
}
