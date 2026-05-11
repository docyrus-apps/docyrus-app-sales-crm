import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ICollectionListParams } from '@/collections/types'
import { useBaseCrmLeadsCollection } from '@/collections'

interface UseLeadsOptions {
  enabled?: boolean
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
  'countries(id,name)',
  'record_owner',
  'deal_value',
  'converted_organization(id,name)',
  'converted_contact(id,name)',
  'converted_deal(id,name)',
  'converted_on',
  'conversion_state',
  'conversion_mode',
  'created_on',
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
  'contact_message',
  'contact_job_title',
  'company_name_text',
  'company_email',
  'company_phone',
  'company_industry',
  'company_size',
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
  'created_on',
]

/**
 * Hook to list leads with optional filters
 */
export function useLeads(
  params?: ICollectionListParams,
  options: UseLeadsOptions = {},
) {
  const leadsCollection = useBaseCrmLeadsCollection()

  return useQuery({
    queryKey: ['leads', params],
    queryFn: async () => {
      const response = await leadsCollection.list({
        ...params,
        columns: params?.columns || LEAD_LIST_COLUMNS,
        orderBy: params?.orderBy || 'created_on DESC',
      })
      return response
    },
    enabled: options.enabled,
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
        columns: LEAD_DETAIL_COLUMNS,
      })
      return response
    },
    enabled: !!leadId,
  })
}

/**
 * Hook to create a new lead
 */
export function useCreateLead() {
  const leadsCollection = useBaseCrmLeadsCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await leadsCollection.create(data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success('Lead created successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create lead')
    },
  })
}

/**
 * Hook to update a lead
 */
export function useUpdateLead() {
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
      toast.success('Lead updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update lead')
    },
  })
}

/**
 * Hook to delete a lead
 */
export function useDeleteLead() {
  const leadsCollection = useBaseCrmLeadsCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (leadId: string) => {
      await leadsCollection.delete(leadId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success('Lead deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete lead')
    },
  })
}

/**
 * Hook to delete multiple leads
 */
export function useDeleteLeads() {
  const leadsCollection = useBaseCrmLeadsCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (leadIds: Array<string>) => {
      await leadsCollection.deleteMany({ recordIds: leadIds })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success('Leads deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete leads')
    },
  })
}
