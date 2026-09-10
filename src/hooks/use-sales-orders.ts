import { useTranslation } from 'react-i18next'
import type { ICollectionListParams } from '@/collections/types'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useBaseCrmSalesOrderCollection } from '@/collections'

export function useSalesOrders(params?: ICollectionListParams) {
  const salesOrderCollection = useBaseCrmSalesOrderCollection()

  return useQuery({
    queryKey: ['sales-orders', params],
    queryFn: async () => {
      const response = await salesOrderCollection.list({
        ...params,
        columns: params?.columns || [
          'id',
          'organization(id,name)',
          'status',
          'sub_total',
          'tax_total',
          'grand_total',
          'created_on',
          'quote_template_id',
          'quote_doc_json'
        ],
        orderBy: params?.orderBy || 'created_on DESC'
      })

      return response
    }
  })
}

export function useSalesOrder(orderId: string | undefined) {
  const salesOrderCollection = useBaseCrmSalesOrderCollection()

  return useQuery({
    queryKey: ['sales-orders', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required')

      return await salesOrderCollection.get(orderId, {
        columns: [
          'id',
          'organization(id,name,phone,email)',
          'deal(id,name)',
          'status',
          'sub_total',
          'tax_total',
          'grand_total',
          'created_on',
          'record_owner',
          'quote_template_id',
          'quote_doc_json'
        ]
      })
    },
    enabled: !!orderId
  })
}

export function useCreateSalesOrder() {
  const { t } = useTranslation()
  const salesOrderCollection = useBaseCrmSalesOrderCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => await salesOrderCollection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('salesOrders.createdSuccess'))
    },
    onError: (error: any) => toast.error(error?.message || t('salesOrders.createError'))
  })
}

export function useUpdateSalesOrder() {
  const { t } = useTranslation()
  const salesOrderCollection = useBaseCrmSalesOrderCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: any }) => await salesOrderCollection.update(orderId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      queryClient.invalidateQueries({
        queryKey: ['sales-orders', variables.orderId]
      })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('salesOrders.updatedSuccess'))
    },
    onError: (error: any) => toast.error(error?.message || t('salesOrders.updateError'))
  })
}

export function useDeleteSalesOrder() {
  const { t } = useTranslation()
  const salesOrderCollection = useBaseCrmSalesOrderCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderId: string) => await salesOrderCollection.delete(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('salesOrders.deletedSuccess'))
    },
    onError: (error: any) => toast.error(error?.message || t('salesOrders.deleteError'))
  })
}
