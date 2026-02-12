import { useQuery } from '@tanstack/react-query'
import type { ICollectionListParams } from '@/collections/types'
import { UsersCollection } from '@/collections'

/**
 * Hook to list users with optional filters
 */
export function useUsers(params?: ICollectionListParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const response = await UsersCollection.list({
        ...params,
        columns: params?.columns || [
          'id',
          'email',
          'firstname',
          'lastname',
          'mobile',
          'job_title',
        ],
      })
      return response
    },
  })
}

/**
 * Hook to get a single user by ID
 */
export function useUser(userId: string | undefined) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required')
      }
      const response = await UsersCollection.get(userId, {
        columns: [
          'id',
          'email',
          'firstname',
          'lastname',
          'mobile',
          'job_title',
          'gender',
          'time_zone',
          'language',
        ],
      })
      return response
    },
    enabled: !!userId,
  })
}
