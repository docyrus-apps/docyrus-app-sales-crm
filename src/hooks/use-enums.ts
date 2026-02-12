import { useQuery } from '@tanstack/react-query'
import { EnumsCollection } from '@/collections'
import { QUERY_CONFIG } from '@/lib/constants'

/**
 * Hook to fetch and cache enum options
 * Enums are cached for 1 hour as they rarely change
 */
export function useEnums() {
  return useQuery({
    queryKey: ['enums'],
    queryFn: async () => {
      const response = await EnumsCollection.getEnums()
      return response
    },
    staleTime: QUERY_CONFIG.STALE_TIME.ENUMS,
  })
}

/**
 * Hook to get specific enum options by field name
 */
export function useEnumOptions(fieldName: string) {
  const { data: enums, isLoading, error } = useEnums()

  return {
    options: enums?.[fieldName] || [],
    isLoading,
    error,
  }
}
