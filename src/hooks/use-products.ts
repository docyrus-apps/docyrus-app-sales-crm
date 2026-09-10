import { useTranslation } from 'react-i18next'
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
        'name',
        'product_code',
        'category',
        'unit_price',
        'Unit',
        'tax',
        'created_on'
      ]
      const columns = params?.columns || defaultColumns
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
          'name',
          'product_code',
          'category',
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
  const { t } = useTranslation()
  const productCollection = useBaseCrmProductCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => await productCollection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('products.createdSuccess'))
    },
    onError: (error: any) => toast.error(error?.message || t('products.createError'))
  })
}

export function useUpdateProduct() {
  const { t } = useTranslation()
  const productCollection = useBaseCrmProductCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ productId, data }: { productId: string; data: any }) => await productCollection.update(productId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({
        queryKey: ['products', variables.productId]
      })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('products.updatedSuccess'))
    },
    onError: (error: any) => toast.error(error?.message || t('products.updateError'))
  })
}

export function useDeleteProduct() {
  const { t } = useTranslation()
  const productCollection = useBaseCrmProductCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId: string) => await productCollection.delete(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('products.deletedSuccess'))
    },
    onError: (error: any) => toast.error(error?.message || t('products.deleteError'))
  })
}
