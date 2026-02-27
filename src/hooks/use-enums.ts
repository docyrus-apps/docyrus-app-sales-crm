import { useQuery } from '@tanstack/react-query'
import { useEnumsCollection } from '@/collections'
import { QUERY_CONFIG } from '@/lib/constants'

/**
 * Hook to fetch and cache enum options
 * Enums are cached for 1 hour as they rarely change
 */
export function useEnums() {
  const enumsCollection = useEnumsCollection()

  return useQuery({
    queryKey: ['enums'],
    queryFn: async () => {
      const response = await enumsCollection.getEnums()
      return response
    },
    staleTime: QUERY_CONFIG.STALE_TIME.ENUMS,
  })
}

/**
 * Hook to get specific enum options by field name
 * Flattens the nested enum structure to find options
 */
export function useEnumOptions(fieldName: string) {
  const { data: enums, isLoading, error } = useEnums()

  // Flatten nested structure to find options
  const options = enums
    ? Object.values(enums).flatMap((app) =>
        Object.values(app).flatMap((dataSource) => {
          const fieldOptions = dataSource[fieldName]
          if (Array.isArray(fieldOptions)) {
            return fieldOptions.map((option: any) => ({
              label: option.name,
              value: option.id,
            }))
          }
          return []
        }),
      )
    : []

  return {
    options,
    isLoading,
    error,
  }
}
