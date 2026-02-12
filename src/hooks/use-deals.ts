import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { base_crmDealsCollection } from '@/collections'
import type { ICollectionListParams } from '@/collections/types'
import { toast } from 'sonner'

/**
 * Hook to list deals with optional filters
 */
export function useDeals(params?: ICollectionListParams) {
  return useQuery({
    queryKey: ['deals', params],
    queryFn: async () => {
      const response = await base_crmDealsCollection.list({
        ...params,
        columns: params?.columns || [
          'id',
          'record_owner',
          'expected_revenue',
          'deal_value',
          'stage',
          'organizations(id,name)',
          'contact_person(id,name)',
          'hot_prospect',
          'expected_closing_date',
          'close_probability',
          'customer_type',
          'lead_source',
          'created_on',
        ],
      })
      return response
    },
  })
}

/**
 * Hook to get a single deal by ID
 */
export function useDeal(dealId: string | undefined) {
  return useQuery({
    queryKey: ['deals', dealId],
    queryFn: async () => {
      if (!dealId) {
        throw new Error('Deal ID is required')
      }
      const response = await base_crmDealsCollection.get(dealId, {
        columns: [
          'id',
          'record_owner',
          'expected_revenue',
          'deal_value',
          'stage',
          'organizations(id,name,phone,email,website)',
          'contact_person(id,name,email,mobile,job_title)',
          'hot_prospect',
          'expected_closing_date',
          'close_probability',
          'customer_type',
          'lead_source',
          'reason_for_lost',
          'closed_date',
          'follow_up_on',
          'country(id,name,currency_symbol)',
          'followers',
          'created_on',
          'modified_on',
        ],
      })
      return response
    },
    enabled: !!dealId,
  })
}

/**
 * Hook to create a new deal
 */
export function useCreateDeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await base_crmDealsCollection.create({ data })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      toast.success('Deal created successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create deal')
    },
  })
}

/**
 * Hook to update a deal
 */
export function useUpdateDeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ dealId, data }: { dealId: string; data: any }) => {
      const response = await base_crmDealsCollection.update(dealId, { data })
      return response
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      queryClient.invalidateQueries({ queryKey: ['deals', variables.dealId] })
      toast.success('Deal updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update deal')
    },
  })
}

/**
 * Hook to delete a deal
 */
export function useDeleteDeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dealId: string) => {
      await base_crmDealsCollection.delete(dealId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      toast.success('Deal deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete deal')
    },
  })
}

/**
 * Hook to delete multiple deals
 */
export function useDeleteDeals() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dealIds: string[]) => {
      await base_crmDealsCollection.deleteMany({ recordIds: dealIds })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      toast.success('Deals deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete deals')
    },
  })
}
