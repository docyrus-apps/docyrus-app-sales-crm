import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ICollectionListParams } from '@/collections/types'
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
        ],
      })
      return response
    },
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
          'status',
          'sub_total',
          'tax_total',
          'grand_total',
          'created_on',
        ],
      })
    },
    enabled: !!orderId,
  })
}

export function useCreateSalesOrder() {
  const salesOrderCollection = useBaseCrmSalesOrderCollection()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => await salesOrderCollection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      toast.success('Sales order created successfully')
    },
    onError: (error: any) =>
      toast.error(error?.message || 'Failed to create sales order'),
  })
}

export function useUpdateSalesOrder() {
  const salesOrderCollection = useBaseCrmSalesOrderCollection()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: any }) =>
      await salesOrderCollection.update(orderId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      queryClient.invalidateQueries({
        queryKey: ['sales-orders', variables.orderId],
      })
      toast.success('Sales order updated successfully')
    },
    onError: (error: any) =>
      toast.error(error?.message || 'Failed to update sales order'),
  })
}

export function useDeleteSalesOrder() {
  const salesOrderCollection = useBaseCrmSalesOrderCollection()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (orderId: string) =>
      await salesOrderCollection.delete(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      toast.success('Sales order deleted successfully')
    },
    onError: (error: any) =>
      toast.error(error?.message || 'Failed to delete sales order'),
  })
}
