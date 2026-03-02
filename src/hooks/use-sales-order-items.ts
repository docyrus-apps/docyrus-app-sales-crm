import { useQuery } from '@tanstack/react-query'
import type { ICollectionListParams } from '@/collections/types'
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
          'net_total',
        ],
        orderBy: params?.orderBy || 'created_on DESC',
      })
      return response
    },
    enabled: !!params,
  })
}
