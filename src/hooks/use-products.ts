import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { base_crmProductCollection } from '@/collections'
import type { ICollectionListParams } from '@/collections/types'
import { toast } from 'sonner'

export function useProducts(params?: ICollectionListParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const response = await base_crmProductCollection.list({
        ...params,
        columns: params?.columns || [
          'id',
          'product_code',
          'unit_price',
          'Unit',
          'category',
          'tax',
          'created_on',
        ],
      })
      return response
    },
  })
}

export function useProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ['products', productId],
    queryFn: async () => {
      if (!productId) throw new Error('Product ID is required')
      return await base_crmProductCollection.get(productId, {
        columns: ['id', 'product_code', 'unit_price', 'Unit', 'category', 'tax', 'created_on', 'modified_on'],
      })
    },
    enabled: !!productId,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => await base_crmProductCollection.create({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product created successfully')
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to create product'),
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ productId, data }: { productId: string; data: any }) =>
      await base_crmProductCollection.update(productId, { data }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products', variables.productId] })
      toast.success('Product updated successfully')
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to update product'),
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (productId: string) => await base_crmProductCollection.delete(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product deleted successfully')
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to delete product'),
  })
}
