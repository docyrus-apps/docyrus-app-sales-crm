import type { ICollectionListParams } from '@/collections/types'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useBaseCrmSalesOrderItemCollection } from '@/collections'

export function useSalesOrderItems(params?: ICollectionListParams) {
  const salesOrderItemCollection = useBaseCrmSalesOrderItemCollection()

  return useQuery({
    queryKey: ['sales-order-items', params],
    queryFn: async () => {
      const response = await salesOrderItemCollection.list({
        ...params,
        columns: params?.columns || [
          'id',
          'product(id,name)',
          'category',
          'qty',
          'unit_price',
          'discount',
          'tax_rate',
          'total',
          'gross_total',
          'net_total'
        ],
        orderBy: params?.orderBy || 'created_on DESC'
      })

      return response
    },
    enabled: !!params
  })
}

export function useCreateSalesOrderItem() {
  const salesOrderItemCollection = useBaseCrmSalesOrderItemCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Record<string, any>) => await salesOrderItemCollection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-order-items'] })
    }
  })
}

export function useUpdateSalesOrderItem() {
  const salesOrderItemCollection = useBaseCrmSalesOrderItemCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      itemId,
      data
    }: {
      itemId: string;
      data: Record<string, any>;
    }) => await salesOrderItemCollection.update(itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-order-items'] })
    }
  })
}

export function useDeleteSalesOrderItem() {
  const salesOrderItemCollection = useBaseCrmSalesOrderItemCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (itemId: string) => await salesOrderItemCollection.delete(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-order-items'] })
    }
  })
}
