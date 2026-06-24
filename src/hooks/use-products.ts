import type { ICollectionListParams } from '@/collections/types'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useBaseCrmProductCollection } from '@/collections'

export function useProducts(params?: ICollectionListParams) {
  const productCollection = useBaseCrmProductCollection()

  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const defaultColumns = [
        'id',
        'product_code',
        'unit_price',
        'Unit',
        'tax',
        'created_on'
      ]
      const columns = (params?.columns || defaultColumns).filter(
        column => !['name', 'category'].includes(column)
      )
      const response = await productCollection.list({
        ...params,
        columns,
        orderBy: params?.orderBy || 'created_on DESC'
      })

      if (Array.isArray(response)) return response

      const wrapped = response as any

      if (Array.isArray(wrapped?.data)) return wrapped.data
      if (Array.isArray(wrapped?.items)) return wrapped.items
      if (Array.isArray(wrapped?.records)) return wrapped.records
      if (Array.isArray(wrapped?.data?.items)) return wrapped.data.items
      if (Array.isArray(wrapped?.data?.records)) return wrapped.data.records

      return []
    }
  })
}

export function useProduct(productId: string | undefined) {
  const productCollection = useBaseCrmProductCollection()

  return useQuery({
    queryKey: ['products', productId],
    queryFn: async () => {
      if (!productId) throw new Error('Product ID is required')

      return await productCollection.get(productId, {
        columns: [
          'id',
          'product_code',
          'unit_price',
          'Unit',
          'tax',
          'created_on'
        ]
      })
    },
    enabled: !!productId
  })
}

export function useCreateProduct() {
  const productCollection = useBaseCrmProductCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => await productCollection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product created successfully')
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to create product')
  })
}

export function useUpdateProduct() {
  const productCollection = useBaseCrmProductCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ productId, data }: { productId: string; data: any }) => await productCollection.update(productId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({
        queryKey: ['products', variables.productId]
      })
      toast.success('Product updated successfully')
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to update product')
  })
}

export function useDeleteProduct() {
  const productCollection = useBaseCrmProductCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId: string) => await productCollection.delete(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product deleted successfully')
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to delete product')
  })
}
