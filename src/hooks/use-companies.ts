import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ICollectionListParams } from '@/collections/types'
import { baseOrganizationCollection } from '@/collections'

/**
 * Hook to list companies (organizations) with optional filters
 */
export function useCompanies(params?: ICollectionListParams) {
  return useQuery({
    queryKey: ['companies', params],
    queryFn: async () => {
      const response = await baseOrganizationCollection.list({
        ...params,
        columns: params?.columns || [
          'id',
          'name',
          'industry',
          'phone',
          'email',
          'website',
          'country(id,name)',
          'city(id,name)',
          'status',
          'type',
          'address',
          'tax_number',
          'created_on',
        ],
      })
      return response
    },
  })
}

/**
 * Hook to get a single company by ID
 */
export function useCompany(companyId: string | undefined) {
  return useQuery({
    queryKey: ['companies', companyId],
    queryFn: async () => {
      if (!companyId) {
        throw new Error('Company ID is required')
      }
      const response = await baseOrganizationCollection.get(companyId, {
        columns: [
          'id',
          'name',
          'industry',
          'phone',
          'email',
          'website',
          'country(id,name,currency_symbol)',
          'city(id,name,latitude,longitude)',
          'status',
          'type',
          'address',
          'tax_number',
          'district',
          'created_on',
          'modified_on',
        ],
      })
      return response
    },
    enabled: !!companyId,
  })
}

/**
 * Hook to create a new company
 */
export function useCreateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await baseOrganizationCollection.create({ data })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast.success('Company created successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create company')
    },
  })
}

/**
 * Hook to update a company
 */
export function useUpdateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      companyId,
      data,
    }: {
      companyId: string
      data: any
    }) => {
      const response = await baseOrganizationCollection.update(companyId, {
        data,
      })
      return response
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      queryClient.invalidateQueries({
        queryKey: ['companies', variables.companyId],
      })
      toast.success('Company updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update company')
    },
  })
}

/**
 * Hook to delete a company
 */
export function useDeleteCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (companyId: string) => {
      await baseOrganizationCollection.delete(companyId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast.success('Company deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete company')
    },
  })
}

/**
 * Hook to delete multiple companies
 */
export function useDeleteCompanies() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (companyIds: Array<string>) => {
      await baseOrganizationCollection.deleteMany({ recordIds: companyIds })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast.success('Companies deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete companies')
    },
  })
}
