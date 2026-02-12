import { useQuery } from '@tanstack/react-query'
import type { ICollectionListParams } from '@/collections/types'
import { base_crmDealProductCollection } from '@/collections'

export function useDealProducts(params?: ICollectionListParams) {
  return useQuery({
    queryKey: ['deal-products', params],
    queryFn: async () => {
      const response = await base_crmDealProductCollection.list({
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
