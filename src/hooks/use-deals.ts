import { useTranslation } from 'react-i18next'
import type { ICollectionListParams } from '@/collections/types'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useBaseCrmDealsCollection } from '@/collections'

interface UseDealsOptions {
  enabled?: boolean;
}

/**
 * Hook to list deals with optional filters
 */
export function useDeals(
  params?: ICollectionListParams,
  options: UseDealsOptions = {}
) {
  const dealsCollection = useBaseCrmDealsCollection()

  return useQuery({
    queryKey: ['deals', params],
    queryFn: async () => {
      const response = await dealsCollection.list({
        ...params,
        columns: params?.columns || [
          'id',
          'name',
          'autonumber_id',
          'record_owner',
          'expected_revenue',
          'deal_value',
          'stage',
          'organization(id,name,company_logo)',
          'contact_person(id,name)',
          'hot_prospect',
          'expected_closing_date',
          'close_probability',
          'customer_type',
          'lead_source',
          'created_on'
        ],
        orderBy: params?.orderBy || 'created_on DESC'
      })

      return response
    },
    enabled: options.enabled
  })
}

/**
 * Hook to get a single deal by ID
 */
export function useDeal(dealId: string | undefined) {
  const dealsCollection = useBaseCrmDealsCollection()

  return useQuery({
    queryKey: ['deal', dealId],
    queryFn: async () => {
      if (!dealId) {
        throw new Error('Deal ID is required')
      }
      const response = await dealsCollection.get(dealId, {
        columns: [
          'id',
          'name',
          'autonumber_id',
          'record_owner',
          'expected_revenue',
          'deal_value',
          'stage',
          'organization(id,name,phone,email,website,company_logo)',
          'contact_person(id,name,email,mobile,job_title)',
          'hot_prospect',
          'expected_closing_date',
          'close_probability',
          'customer_type',
          'deal_type',
          'lead_source',
          'reason_for_lost',
          'closed_date',
          'follow_up_on',
          'country(id,name,currency_symbol)',
          'deals_products_tags(id,name)',
          'followers',
          'created_on'
        ]
      })

      return response
    },
    enabled: !!dealId
  })
}

/**
 * Hook to create a new deal
 */
export function useCreateDeal() {
  const { t } = useTranslation()
  const dealsCollection = useBaseCrmDealsCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await dealsCollection.create(data)

      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('deals.createdSuccess'))
    },
    onError: (error: any) => {
      toast.error(error?.message || t('deals.createError'))
    }
  })
}

/**
 * Hook to update a deal
 */
export function useUpdateDeal() {
  const { t } = useTranslation()
  const dealsCollection = useBaseCrmDealsCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ dealId, data }: { dealId: string; data: any }) => {
      const response = await dealsCollection.update(dealId, data)

      return response
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      queryClient.invalidateQueries({ queryKey: ['deal', variables.dealId] })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('deals.updatedSuccess'))
    },
    onError: (error: any) => {
      toast.error(error?.message || t('deals.updateError'))
    }
  })
}

/**
 * Hook to delete a deal
 */
export function useDeleteDeal() {
  const { t } = useTranslation()
  const dealsCollection = useBaseCrmDealsCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dealId: string) => {
      await dealsCollection.delete(dealId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('deals.deletedSuccess'))
    },
    onError: (error: any) => {
      toast.error(error?.message || t('deals.deleteError'))
    }
  })
}

/**
 * Hook to delete multiple deals
 */
export function useDeleteDeals() {
  const { t } = useTranslation()
  const dealsCollection = useBaseCrmDealsCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dealIds: Array<string>) => {
      await dealsCollection.deleteMany({ recordIds: dealIds })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('deals.bulkDeletedSuccess'))
    },
    onError: (error: any) => {
      toast.error(error?.message || t('deals.bulkDeleteError'))
    }
  })
}
