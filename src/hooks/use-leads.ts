import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ICollectionListParams } from '@/collections/types'
import { base_crmLeadsCollection } from '@/collections'

/**
 * Hook to list leads with optional filters
 */
export function useLeads(params?: ICollectionListParams) {
  return useQuery({
    queryKey: ['leads', params],
    queryFn: async () => {
      const response = await base_crmLeadsCollection.list({
        ...params,
        columns: params?.columns || [
          'id',
          'title',
          'phone',
          'email',
          'website',
          'lead_source',
          'lead_status',
          'lead_type',
          'company_name(id,name)',
          'countries(id,name)',
          'record_owner',
          'created_on',
        ],
      })
      return response
    },
  })
}

/**
 * Hook to get a single lead by ID
 */
export function useLead(leadId: string | undefined) {
  return useQuery({
    queryKey: ['leads', leadId],
    queryFn: async () => {
      if (!leadId) {
        throw new Error('Lead ID is required')
      }
      const response = await base_crmLeadsCollection.get(leadId, {
        columns: [
          'id',
          'title',
          'phone',
          'email',
          'website',
          'address',
          'city',
          'state',
          'town',
          'lead_source',
          'lead_status',
          'lead_type',
          'contact_message',
          'lost_reason',
          'company_name(id,name,phone,email,website)',
          'countries(id,name)',
          'record_owner',
          'created_on',
        ],
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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await base_crmLeadsCollection.create({ data })
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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ leadId, data }: { leadId: string; data: any }) => {
      const response = await base_crmLeadsCollection.update(leadId, { data })
      return response
    },
    onSuccess: (data, variables) => {
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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (leadId: string) => {
      await base_crmLeadsCollection.delete(leadId)
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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (leadIds: Array<string>) => {
      await base_crmLeadsCollection.deleteMany({ recordIds: leadIds })
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
