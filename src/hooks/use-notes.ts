import { useTranslation } from 'react-i18next'
import type { ICollectionListParams } from '@/collections/types'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useUserTodoCollection } from '@/collections/user-todo.collection'

export function useNotes(params?: ICollectionListParams) {
  const todoCollection = useUserTodoCollection()

  return useQuery({
    queryKey: ['notes', params],
    queryFn: async () => {
      const response = await todoCollection.list({
        ...params,
        columns: params?.columns || [
          'id',
          'title',
          'done',
          'due_date',
          'priority',
          'sort_order',
          'type',
          'archived',
          'created_by'
        ],
        filters: {
          rules: [{ field: 'archived', operator: 'eq', value: false }],
          combinator: 'and'
        },
        orderBy: [{ field: 'sort_order', direction: 'asc' }]
      })

      return response
    }
  })
}

export function useCreateNote() {
  const { t } = useTranslation()
  const todoCollection = useUserTodoCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => await todoCollection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('notes.createdSuccess'))
    },
    onError: (error: any) => toast.error(error?.message || t('notes.createError'))
  })
}
