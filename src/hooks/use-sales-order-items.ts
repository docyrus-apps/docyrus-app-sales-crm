import { useQuery } from '@tanstack/react-query'
import type { ICollectionListParams } from '@/collections/types'
import { base_crmSalesOrderItemCollection } from '@/collections'

export function useSalesOrderItems(params?: ICollectionListParams) {
  return useQuery({
    queryKey: ['sales-order-items', params],
    queryFn: async () => {
      const response = await base_crmSalesOrderItemCollection.list({
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
      })
      return response
    },
    enabled: !!params,
  })
}
