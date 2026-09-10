import { useTranslation } from 'react-i18next'
import type { ICollectionListParams } from '@/collections/types'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useBaseContactCollection } from '@/collections'

export function useContacts(params?: ICollectionListParams) {
  const contactCollection = useBaseContactCollection()

  return useQuery({
    queryKey: ['contacts', params],
    queryFn: async () => {
      const response = await contactCollection.list({
        ...params,
        columns: params?.columns || [
          'id',
          'name',
          'job_title',
          'email',
          'mobile',
          'organization(id,name)',
          'created_on'
        ],
        orderBy: params?.orderBy || 'created_on DESC'
      })

      return response
    }
  })
}

export function useContact(contactId: string | undefined) {
  const contactCollection = useBaseContactCollection()

  return useQuery({
    queryKey: ['contacts', contactId],
    queryFn: async () => {
      if (!contactId) throw new Error('Contact ID is required')

      return await contactCollection.get(contactId, {
        columns: [
          'id',
          'name',
          'job_title',
          'email',
          'mobile',
          'organization(id,name,phone,email,website)',
          'contact_type',
          'contact_status',
          'created_on'
        ]
      })
    },
    enabled: !!contactId
  })
}

export function useCreateContact() {
  const { t } = useTranslation()
  const contactCollection = useBaseContactCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => await contactCollection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('contacts.createdSuccess'))
    },
    onError: (error: any) => toast.error(error?.message || t('contacts.createError'))
  })
}

export function useUpdateContact() {
  const { t } = useTranslation()
  const contactCollection = useBaseContactCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ contactId, data }: { contactId: string; data: any }) => await contactCollection.update(contactId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({
        queryKey: ['contacts', variables.contactId]
      })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('contacts.updatedSuccess'))
    },
    onError: (error: any) => toast.error(error?.message || t('contacts.updateError'))
  })
}

export function useDeleteContact() {
  const { t } = useTranslation()
  const contactCollection = useBaseContactCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (contactId: string) => await contactCollection.delete(contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('contacts.deletedSuccess'))
    },
    onError: (error: any) => toast.error(error?.message || t('contacts.deleteError'))
  })
}
