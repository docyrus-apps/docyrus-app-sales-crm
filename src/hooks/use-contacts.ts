import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { baseContactCollection } from '@/collections'
import type { ICollectionListParams } from '@/collections/types'
import { toast } from 'sonner'

export function useContacts(params?: ICollectionListParams) {
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: async () => {
      const response = await baseContactCollection.list({
        ...params,
        columns: params?.columns || [
          'id',
          'name',
          'job_title',
          'email',
          'mobile',
          'organization(id,name)',
          'created_on',
        ],
      })
      return response
    },
  })
}

export function useContact(contactId: string | undefined) {
  return useQuery({
    queryKey: ['contacts', contactId],
    queryFn: async () => {
      if (!contactId) throw new Error('Contact ID is required')
      return await baseContactCollection.get(contactId, {
        columns: [
          'id',
          'name',
          'job_title',
          'email',
          'mobile',
          'organization(id,name,phone,email,website)',
          'created_on',
          'modified_on',
        ],
      })
    },
    enabled: !!contactId,
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => await baseContactCollection.create({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      toast.success('Contact created successfully')
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to create contact'),
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ contactId, data }: { contactId: string; data: any }) =>
      await baseContactCollection.update(contactId, { data }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['contacts', variables.contactId] })
      toast.success('Contact updated successfully')
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to update contact'),
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (contactId: string) => await baseContactCollection.delete(contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      toast.success('Contact deleted successfully')
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to delete contact'),
  })
}
