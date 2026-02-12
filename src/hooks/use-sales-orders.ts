import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ICollectionListParams } from '@/collections/types'
import { base_crmSalesOrderCollection } from '@/collections'

export function useSalesOrders(params?: ICollectionListParams) {
  return useQuery({
    queryKey: ['sales-orders', params],
    queryFn: async () => {
      const response = await base_crmSalesOrderCollection.list({
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
  return useQuery({
    queryKey: ['sales-orders', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required')
      return await base_crmSalesOrderCollection.get(orderId, {
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
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) =>
      await base_crmSalesOrderCollection.create({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      toast.success('Sales order created successfully')
    },
    onError: (error: any) =>
      toast.error(error?.message || 'Failed to create sales order'),
  })
}

export function useUpdateSalesOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: any }) =>
      await base_crmSalesOrderCollection.update(orderId, { data }),
    onSuccess: (data, variables) => {
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
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (orderId: string) =>
      await base_crmSalesOrderCollection.delete(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      toast.success('Sales order deleted successfully')
    },
    onError: (error: any) =>
      toast.error(error?.message || 'Failed to delete sales order'),
  })
}
