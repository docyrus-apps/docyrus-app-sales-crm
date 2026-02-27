import { useQuery } from '@tanstack/react-query'
import type { ICollectionListParams } from '@/collections/types'
import { useBaseCrmDealProductCollection } from '@/collections'

export function useDealProducts(params?: ICollectionListParams) {
  const dealProductCollection = useBaseCrmDealProductCollection()

  return useQuery({
    queryKey: ['deal-products', params],
    queryFn: async () => {
      const response = await dealProductCollection.list({
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
