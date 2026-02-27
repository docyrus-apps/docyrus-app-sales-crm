import { useQuery } from '@tanstack/react-query'
import { useUsersCollection } from '@/collections'

/**
 * Hook to list users
 */
export function useUsers() {
  const usersCollection = useUsersCollection()

  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await usersCollection.getUsers()
      return response
    },
  })
}

/**
 * Hook to get current user info
 */
export function useMyInfo() {
  const usersCollection = useUsersCollection()

  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const response = await usersCollection.getMyInfo()
      return response
    },
  })
}
